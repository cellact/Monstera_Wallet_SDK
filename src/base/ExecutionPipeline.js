/**
 * Stateless execution pipeline for contract reads and writes: error context,
 * Sapphire write path (tx → receipt → events), and error translation.
 *
 * @typedef {import('../types/index.js').BaseTransactionResult} BaseTransactionResult
 * @typedef {import('../types/index.js').ExecuteWriteOptions} ExecuteWriteOptions
 * @typedef {import('../types/index.js').EthersInterface} EthersInterface
 * @typedef {import('../types/index.js').TransactionReceipt} TransactionReceipt
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../internal/sanitization/Sanitizer.js').Sanitizer} Sanitizer
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

export default class ExecutionPipeline {
  /**
   * @param {object} deps
   * @param {EthersProvider} deps.readProvider
   * @param {WrappedEthersSigner | null} deps.writeSigner
   * @param {import('../errors/pipeline.js').ErrorPipeline} [deps.errorPipeline]
   * @param {Sanitizer} [deps.sanitizer]
   * @param {NetworkConfig} deps.config
   */
  constructor({ readProvider, writeSigner, errorPipeline, sanitizer, config }) {
    this._readProvider = readProvider;
    this._writeSigner = writeSigner;
    this._errorPipeline = errorPipeline ?? sdkErrorPipeline;
    this._sanitizer = sanitizer ?? defaultSanitizer;
    this._config = config;
  }

  /**
   * Build standardized error context from method parameters (sanitizer applied).
   *
   * @param {Record<string, unknown>} options
   * @returns {Record<string, unknown>}
   */
  buildErrorContext(options = {}) {
    return this._sanitizer.forErrorContext({ ...options });
  }

  /**
   * @template TResult
   * @param {() => Promise<TResult>} operation
   * @param {Record<string, unknown>} context
   * @returns {Promise<TResult>}
   */
  async executeRead(operation, context = {}) {
    const { methodName, revertInterface, ...rest } = context;
    const sdkContext = this.buildErrorContext({ ...rest, methodName });

    log.info('Executing read', { methodName });
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
   * @template TResult extends BaseTransactionResult
   * @param {() => Promise<any>} operation
   * @param {Record<string, unknown>} options
   * @returns {Promise<TResult>}
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
   * @param {ExecuteWriteOptions} options
   * @returns {EthersInterface | null}
   */
  _getRevertInterface(options) {
    if (options.revertInterface) {
      return options.revertInterface;
    }
    const first = options.parseEvents?.[0]?.contract;
    return first?.interface ?? null;
  }

  /**
   * @param {ExecuteWriteOptions} options
   * @returns {EthersProvider | null}
   */
  _getReadProvider(options) {
    return options.readProvider ?? options.writeSigner?.provider ?? null;
  }

  /**
   * @param {EthersProvider} readProvider
   * @param {TransactionReceipt} receipt
   * @param {string} txHash
   * @param {EthersInterface | null} iface
   * @returns {Promise<{ revertData: string | null, revertReason: string | null, revertArgs: unknown, revertSignature: string | null }>}
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
   * @template TResult extends BaseTransactionResult
   * @param {() => Promise<any>} txFn
   * @param {ExecuteWriteOptions} options
   * @returns {Promise<TResult>}
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
