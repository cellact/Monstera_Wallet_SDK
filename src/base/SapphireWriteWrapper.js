/**
 * SapphireWriteWrapper
 *
 * Centralizes all write transaction execution logic.
 * Ensures ALL writes go through the same path with:
 * - Sapphire encryption (via pre-wrapped signer)
 * - Consistent error translation (see {@code ethersErrorTranslator.js})
 * - Event parsing
 * - Normalized result format
 *
 * Note: The signer is already wrapped with Sapphire at creation time
 * (via createWriteSigner in providers/sapphire.js). This wrapper focuses
 * on execution, receipt handling, and result normalization.
 *
 * Ethers v6 note: {@code TransactionResponse.wait()} throws CALL_EXCEPTION for
 * mined reverts with {@code data: null} and empty {@code transaction.data} by design
 * (see ethers {@code checkReceipt}). We recover revert bytes via {@code getTransaction}
 * + {@code eth_call} replay when a read provider is available, then decode with the
 * contract ABI ({@code Interface.parseError}).
 *
 * @typedef {import('../types/index.js').BaseTransactionResult} BaseTransactionResult
 * @typedef {import('../types/index.js').ExecuteWriteOptions} ExecuteWriteOptions
 * @typedef {import('../types/index.js').EthersInterface} EthersInterface
 * @typedef {import('../types/index.js').TransactionReceipt} TransactionReceipt
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
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
  toWalletError
} from '../errors/ethersErrorTranslator.js';
import log from '../internal/logger.js';

class SapphireWriteWrapper {
  /**
   * @param {ExecuteWriteOptions} options
   * @returns {EthersInterface | null}
   */
  static _getRevertInterface(options) {
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
  static _getReadProvider(options) {
    return options.readProvider ?? options.writeSigner?.provider ?? null;
  }

  /**
   * Replay the mined transaction as {@code eth_call} at its block to obtain revert data.
   *
   * @private
   * @param {EthersProvider} readProvider
   * @param {TransactionReceipt} receipt
   * @param {string} txHash
   * @param {EthersInterface | null} iface
   * @returns {Promise<{ revertData: string | null, revertReason: string | null, revertArgs: unknown, revertSignature: string | null }>}
   */
  static async _enrichMinedTransactionRevert(readProvider, receipt, txHash, iface) {
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
   * Execute a write transaction through Sapphire-wrapped signer
   *
   * @template TResult extends BaseTransactionResult
   * @param {() => Promise<any>} txFn - Function that returns a transaction promise (e.g., () => contract.method(...))
   * @param {ExecuteWriteOptions} options - Options for the write transaction
   * @returns {Promise<TResult>}
   */
  static async execute(txFn, options = {}) {
    const {
      writeSigner,
      parseEvents = [],
      requireEvents = true,
      extraData = {},
      methodName = 'execute transaction',
      rpcUrl = null,
      readProvider: readProviderOpt = null,
      sdkContext = {}
    } = options;

    const readProvider = readProviderOpt ?? SapphireWriteWrapper._getReadProvider(options);
    const revertInterface = SapphireWriteWrapper._getRevertInterface(options);

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
          enrich = await SapphireWriteWrapper._enrichMinedTransactionRevert(
            readProvider,
            receipt,
            txHash,
            revertInterface
          );
        } catch (e) {
          log.debug('revert enrichment failed', { message: /** @type {Error} */ (e).message });
        }
      }

      throw toWalletError(err, {
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

export default SapphireWriteWrapper;
