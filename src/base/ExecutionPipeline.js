/**
 * Stateless execution pipeline shared by every {@link BaseContractClient} subclass.
 *
 * Handles three responsibilities:
 *   1. Build sanitised SDK error context (via {@code Sanitizer}) so secrets stay out of thrown errors.
 *   2. Run the Sapphire write flow: tx → receipt → optional event parsing → standardised
 *      {@link BaseTransactionResult} payload.
 *   3. Translate any caught error through {@code sdkErrorPipeline} (custom-error decode, RPC revert
 *      extraction, fallback enrichment for mined-but-failed transactions).
 *
 * @typedef {import('../types/index.js').BaseTransactionResult} BaseTransactionResult
 * @typedef {import('../types/index.js').ExecuteWriteOptions} ExecuteWriteOptions
 * @typedef {import('../types/index.js').EthersInterface} EthersInterface
 * @typedef {import('../types/index.js').TransactionReceipt} TransactionReceipt
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../internal/sanitization/Sanitizer.js').Sanitizer} Sanitizer
 *
 * @module base/ExecutionPipeline
 */

import { parseEventFromReceipt } from '../events/index.js';
import {
  WalletError,
  NetworkError,
  EventNotFoundError,
  WriteRequiresSignerError
} from '../errors/index.js';
import {
  applySdkContext,
  decodeCustomError,
  extractRpcRevertBytes,
  sdkErrorPipeline
} from '../errors/pipeline.js';
import log from '../internal/logger.js';
import { sanitizer as defaultSanitizer } from '../internal/sanitization/index.js';

/**
 * @public
 */
export default class ExecutionPipeline {
  /**
   * Construct a pipeline with explicit dependencies (used by every {@link BaseContractClient}).
   *
   * @public
   * @param {object} deps
   * @param {EthersProvider} deps.readProvider - Read provider, used both for plain reads and for revert enrichment after a failed write
   * @param {WrappedEthersSigner | null} deps.writeSigner - Sapphire-wrapped signer used for writes ({@code null} for read-only clients)
   * @param {import('../errors/pipeline.js').ErrorPipeline} [deps.errorPipeline] - Override for the default {@code sdkErrorPipeline}
   * @param {Sanitizer} [deps.sanitizer] - Override for the default sanitiser (redacts sensitive fields from the error context)
   * @param {NetworkConfig} deps.config - Resolved network config (used for {@code rpcUrl} in error context)
   */
  constructor({ readProvider, writeSigner, errorPipeline, sanitizer, config }) {
    this._readProvider = readProvider;
    this._writeSigner = writeSigner;
    this._errorPipeline = errorPipeline ?? sdkErrorPipeline;
    this._sanitizer = sanitizer ?? defaultSanitizer;
    this._config = config;
  }

  /**
   * Build a sanitised SDK error context from arbitrary call options.
   *
   * The sanitiser strips known sensitive parameters (passwords, mnemonics, raw private keys, etc.)
   * before the result is attached to thrown {@link WalletError}s.
   *
   * @public
   * @param {Record<string, unknown>} [options] - Method options to redact
   * @returns {Record<string, unknown>} Sanitised context safe to attach to errors
   */
  buildErrorContext(options = {}) {
    return this._sanitizer.forErrorContext({ ...options });
  }

  /**
   * Run a read {@code operation} and translate any thrown error through the SDK error pipeline.
   *
   * @public
   * @async
   * @template TResult
   * @param {() => Promise<TResult>} operation - The async ethers read call
   * @param {Record<string, unknown>} [context] - Method name + extra fields for the error context (sanitised)
   * @returns {Promise<TResult>} The value returned by {@code operation}
   * @throws {NetworkError} If the underlying RPC transport fails
   * @throws {ContractRevertError} If the call reverts (custom error or {@code Error(string)})
   * @throws {WalletError} For any other failure (after translation)
   */
  async executeRead(operation, context = {}) {
    const { methodName, revertInterface, ...rest } = context;
    const sdkContext = this.buildErrorContext({ ...rest, methodName });

    log.debug('Executing read', { methodName });
    try {
      return await operation();
    } catch (err) {
      this._errorPipeline.rethrow(err, {
        methodName,
        rpcUrl: this._config?.rpcUrl ?? null,
        revertInterface: revertInterface ?? undefined,
        sdkContext
      });
    }
  }

  /**
   * Run a write {@code operation} (broadcast → wait → parse events) and translate failures.
   *
   * @public
   * @async
   * @template {BaseTransactionResult} TResult
   * @param {() => Promise<any>} operation - The async ethers write call (returns a transaction response)
   * @param {Record<string, unknown>} [options] - {@code methodName}, {@code parseEvents}, {@code requireEvents}, {@code extraData}, {@code revertInterface} plus error-context fields
   * @returns {Promise<TResult>} {@link BaseTransactionResult} merged with parsed events and {@code extraData}
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If broadcast or receipt fetch fails
   * @throws {ContractRevertError} If the transaction reverts (decoded via {@code revertInterface} when available)
   * @throws {EventNotFoundError} If {@code requireEvents !== false} and a required event is missing
   * @throws {EventParseError} If a matching log fails to decode or map
   * @throws {WalletError} For any other failure (after translation)
   */
  async executeWrite(operation, options = {}) {
    const {
      parseEvents,
      requireEvents,
      extraData,
      methodName,
      revertInterface,
      ...errorContext
    } = options;
    const sdkContext = this.buildErrorContext({ ...errorContext, methodName });
    
    log.info('Executing write', { methodName });
    try {
      return await this._executeWriteTransaction(operation, {
        parseEvents,
        requireEvents,
        extraData,
        methodName,
        revertInterface,
        sdkContext,
        writeSigner: this._writeSigner,
        readProvider: this._readProvider
      });
    } catch (error) {
      this._errorPipeline.rethrow(error, {
        methodName,
        rpcUrl: this._config?.rpcUrl ?? null,
        revertInterface: revertInterface ?? undefined,
        sdkContext
      });
    }
  }

  /**
   * Resolve the {@link EthersInterface} used to decode custom Solidity errors.
   *
   * Falls back to the first {@code parseEvents} contract's interface when no explicit
   * {@code revertInterface} is provided.
   *
   * @private
   * @param {ExecuteWriteOptions} options
   * @returns {EthersInterface | null} ABI interface, or {@code null} when none is available
   */
  _getRevertInterface(options) {
    if (options.revertInterface) {
      return options.revertInterface;
    }
    const first = options.parseEvents?.[0]?.contract;
    return first?.interface ?? null;
  }

  /**
   * Pick the read provider used to enrich revert data after a failed write.
   *
   * @private
   * @param {ExecuteWriteOptions} options
   * @returns {EthersProvider | null} Provider attached to the call, or the signer's provider, or {@code null}
   */
  _getReadProvider(options) {
    return options.readProvider ?? options.writeSigner?.provider ?? null;
  }

  /**
   * Replay a mined-but-failed transaction with {@code eth_call} at the receipt's block to recover
   * revert data that ethers v6 omits from {@code tx.wait()} failures.
   *
   * Best-effort: always returns an object even when enrichment fails.
   *
   * @private
   * @async
   * @param {EthersProvider} readProvider - Provider used to replay the call (must support {@code call} at a block tag)
   * @param {TransactionReceipt} receipt - Receipt of the failed transaction
   * @param {string} txHash - Transaction hash (for {@code getTransaction} lookup)
   * @param {EthersInterface | null} iface - ABI used to decode custom errors
   * @returns {Promise<{ revertData: string | null, revertReason: string | null, revertArgs: unknown, revertSignature: string | null }>} Enrichment data (any field may be {@code null})
   */
  async _enrichMinedTransactionRevert(readProvider, receipt, txHash, iface) {
    const result = {
      revertData: /** @type {string | null} */ (null),
      revertReason: null,
      revertArgs: null,
      revertSignature: /** @type {string | null} */ (null)
    };
    if (!readProvider || !txHash || receipt?.blockNumber == null) {
      return result;
    }

    let toAddr = receipt.to;
    let fromAddr = receipt.from;
    /** @type {string | null} */
    let calldata = null;

    try {
      const tx = await readProvider.getTransaction(txHash);
      if (tx) {
        if (tx.to) {
          toAddr = tx.to;
        }
        if (tx.from) {
          fromAddr = tx.from;
        }
        calldata = tx.data ?? null;
      }
    } catch (e) {
      log.debug('getTransaction failed while resolving revert data', { message: /** @type {Error} */ (e).message });
    }

    if (!toAddr || !fromAddr || !calldata || calldata === '0x') {
      return result;
    }

    try {
      await readProvider.call({
        to: toAddr,
        data: calldata,
        from: fromAddr,
        blockTag: receipt.blockNumber
      });
    } catch (callErr) {
      const extracted = extractRpcRevertBytes(callErr);
      if (extracted) {
        result.revertData = extracted;
      }
      const rev = /** @type {{ revert?: { name?: string } }} */ (callErr).revert;
      if (rev?.name && !result.revertReason) {
        result.revertReason = rev.name;
      }
    }

    if (result.revertData && iface) {
      const decoded = decodeCustomError(iface, result.revertData);
      if (decoded.revertReason) {
        result.revertReason = decoded.revertReason;
      }
      if (decoded.revertArgs != null) {
        result.revertArgs = decoded.revertArgs;
      }
      if (decoded.revertSignature) {
        result.revertSignature = decoded.revertSignature;
      }
    }

    return result;
  }

  /**
   * Execute a single write transaction (broadcast → wait → parse events → build result).
   *
   * Most errors are not re-thrown directly: they fall through to the catch block where revert
   * enrichment runs and the error pipeline produces the final {@link WalletError}.
   *
   * @private
   * @async
   * @template {BaseTransactionResult} TResult
   * @param {() => Promise<any>} txFn - Function that returns the ethers tx response
   * @param {ExecuteWriteOptions} [options] - Resolved options (signer, parseEvents, etc.)
   * @returns {Promise<TResult>} {@link BaseTransactionResult} with parsed events and {@code extraData} merged
   * @throws {WriteRequiresSignerError} If no write signer is supplied (defensive — checked again here even after the registry)
   * @throws {NetworkError} If broadcast returns no tx response or no receipt
   * @throws {EventNotFoundError} If {@code requireEvents !== false} and a parsed event is missing
   * @throws {EventParseError} If event decoding/mapping fails after a matching log
   * @throws {WalletError} Re-thrown after applying SDK context (subclass errors propagate unchanged)
   *
   * @remarks
   * When {@code requireEvents} is {@code false}, an empty {@code eventData} from parsing skips {@link EventNotFoundError};
   * thrown errors from invalid {@code eventDef} or {@link EventParseError} during decode/mapping still propagate.
   */
  async _executeWriteTransaction(txFn, options = {}) {
    const {
      writeSigner = this._writeSigner,
      parseEvents = [],
      requireEvents = true,
      extraData = {},
      methodName = 'execute transaction',
      rpcUrl = this._config?.rpcUrl ?? null,
      readProvider: readProviderOpt = null,
      sdkContext = {}
    } = options;

    const readProvider =
      readProviderOpt ?? this._getReadProvider({ writeSigner });
    const revertInterface = this._getRevertInterface(options);

    if (!writeSigner) {
      const err = new WriteRequiresSignerError('write transaction');
      applySdkContext(err, sdkContext);
      throw err;
    }

    try {
      const tx = await txFn();
      if (tx == null || typeof tx.hash !== 'string') {
        const err = new NetworkError(
          `No transaction response from ${methodName} (RPC or signer may have failed before broadcast)`,
          rpcUrl,
          null
        );
        applySdkContext(err, sdkContext);
        throw err;
      }
      log.debug('tx submitted', { hash: tx.hash });

      const receipt = await tx.wait();
      if (receipt == null || typeof receipt.hash !== 'string') {
        const err = new NetworkError(
          `No receipt returned for ${methodName} (hash ${tx.hash})`,
          rpcUrl,
          null
        );
        applySdkContext(err, sdkContext);
        throw err;
      }
      log.info('Write succeeded', { methodName, hash: receipt.hash });

      const parsedEvents = {};
      if (parseEvents.length > 0) {
        for (const { eventDef, contract } of parseEvents) {
          const eventName = eventDef.eventName || eventDef.name || 'Unknown';
          const eventData = parseEventFromReceipt(eventDef, receipt, contract);

          if (requireEvents && !eventData) {
            log.warn('Expected event not found in receipt', { eventName, receiptHash: receipt.hash });
            const err = new EventNotFoundError(eventName, receipt.hash);
            applySdkContext(err, sdkContext);
            throw err;
          }

          if (eventData) {
            Object.assign(parsedEvents, eventData);
          }
        }
      }

      return /** @type {TResult} */ ({
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        ...parsedEvents,
        ...extraData
      });
    } catch (error) {
      log.debug('Write failed before error translation', {
        methodName,
        errorName: /** @type {Error} */ (error).name,
        errorCode: /** @type {Error & { code?: string }} */ (error).code ?? /** @type {any} */ (error).error?.code,
        errorMessage: /** @type {Error} */ (error).message
      });

      if (error instanceof WalletError) {
        applySdkContext(/** @type {WalletError} */ (error), sdkContext);
        throw error;
      }

      /** @type {Record<string, unknown>} */
      let enrich = {};
      const err = /** @type {Error & { code?: string; receipt?: TransactionReceipt }} */ (error);
      const code = err.code || /** @type {any} */ (err).error?.code;
      const receipt = err.receipt;
      const txHash = receipt?.hash ?? /** @type {any} */ (err).transactionHash;
      const failedOnChain =
        receipt &&
        txHash &&
        receipt.status != null &&
        Number(receipt.status) === 0;

      if ((code === 'CALL_EXCEPTION' || code === 'UNPREDICTABLE_GAS_LIMIT') && failedOnChain && readProvider) {
        try {
          enrich = await this._enrichMinedTransactionRevert(
            readProvider,
            receipt,
            txHash,
            revertInterface
          );
        } catch (e) {
          log.debug('revert enrichment failed', { message: /** @type {Error} */ (e).message });
        }
      }

      this._errorPipeline.rethrow(err, {
        methodName,
        rpcUrl,
        revertInterface,
        sdkContext,
        receipt: receipt ?? undefined,
        transactionHash: typeof txHash === 'string' ? txHash : null,
        ...enrich
      });
    }
  }
}
