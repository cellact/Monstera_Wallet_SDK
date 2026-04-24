/**
 * SapphireWriteWrapper
 *
 * Centralizes all write transaction execution logic.
 * Ensures ALL writes go through the same path with:
 * - Sapphire encryption (via pre-wrapped signer)
 * - Consistent error translation
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
 * contract ABI (equivalent to ethers v5 {@code Interface.decodeErrorResult}; in v6 use
 * {@code Interface.decodeErrorResult} on the contract interface).
 *
 * @typedef {import('../types/index.js').BaseTransactionResult} BaseTransactionResult
 * @typedef {import('../types/index.js').ExecuteWriteOptions} ExecuteWriteOptions
 */

import { parseEventFromReceipt } from '../events/index.js';
import {
  WalletError,
  NetworkError,
  ContractRevertError,
  EventNotFoundError,
  WriteRequiresSignerError
} from '../errors/index.js';
import log from '../internal/logger.js';

class SapphireWriteWrapper {
  /**
   * @param {ExecuteWriteOptions} options
   * @returns {import('ethers').Interface | null}
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
   * @returns {import('ethers').Provider | null}
   */
  static _getReadProvider(options) {
    return options.readProvider ?? options.writeSigner?.provider ?? null;
  }

  /**
   * Revert payload from ethers CALL_EXCEPTION or nested JSON-RPC error.
   *
   * @private
   * @param {unknown} err
   * @returns {string | null}
   */
  static _extractRpcRevertBytes(err) {
    let d = /** @type {{ data?: unknown }} */ (err).data;
    if (typeof d !== 'string' || d.length < 10) {
      d = /** @type {{ error?: { data?: unknown } }} */ (err).error?.data;
    }
    if (typeof d !== 'string' || d.length < 10) {
      const info = /** @type {{ error?: { data?: unknown } }} */ (err).info;
      d = info?.error?.data;
    }
    if (typeof d === 'string' && d.startsWith('0x') && d.length >= 10) {
      return d;
    }
    return null;
  }

  /**
   * Decode Solidity custom error using ABI (ethers v6 Interface).
   *
   * @private
   * @param {import('ethers').Interface | null} iface
   * @param {string} data
   * @returns {{ revertReason: string | null, revertArgs: unknown }}
   */
  static _decodeCustomError(iface, data) {
    if (!iface || !data) {
      return { revertReason: null, revertArgs: null };
    }
    const selector = data.slice(0, 10);
    const fragment = iface.getError(selector);
    if (!fragment) {
      return { revertReason: null, revertArgs: null };
    }
    try {
      const args = iface.decodeErrorResult(fragment, data);
      const revertArgs = fragment.inputs?.length ? args : null;
      return { revertReason: fragment.name, revertArgs };
    } catch {
      return { revertReason: fragment.name, revertArgs: null };
    }
  }

  /**
   * Replay the mined transaction as {@code eth_call} at its block to obtain revert data.
   *
   * @private
   * @param {import('ethers').Provider} readProvider
   * @param {import('ethers').TransactionReceipt} receipt
   * @param {string} txHash
   * @param {import('ethers').Interface | null} iface
   * @returns {Promise<{ revertData: string | null, revertReason: string | null, revertArgs: unknown }>}
   */
  static async _enrichMinedTransactionRevert(readProvider, receipt, txHash, iface) {
    const result = { revertData: /** @type {string | null} */ (null), revertReason: null, revertArgs: null };
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
      const extracted = SapphireWriteWrapper._extractRpcRevertBytes(callErr);
      if (extracted) {
        result.revertData = extracted;
      }
      const rev = /** @type {{ revert?: { name?: string } }} */ (callErr).revert;
      if (rev?.name && !result.revertReason) {
        result.revertReason = rev.name;
      }
    }

    if (result.revertData && iface) {
      const decoded = SapphireWriteWrapper._decodeCustomError(iface, result.revertData);
      if (decoded.revertReason) {
        result.revertReason = decoded.revertReason;
      }
      if (decoded.revertArgs != null) {
        result.revertArgs = decoded.revertArgs;
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
      readProvider: readProviderOpt = null
    } = options;

    const readProvider = readProviderOpt ?? SapphireWriteWrapper._getReadProvider(options);
    const revertInterface = SapphireWriteWrapper._getRevertInterface(options);

    if (!writeSigner) {
      throw new WriteRequiresSignerError('write transaction');
    }

    try {
      // Execute transaction function
      // Note: The contract instance passed to txFn should already be using
      // a Sapphire-wrapped signer (created via createWriteSigner)
      const tx = await txFn();
      if (tx == null || typeof tx.hash !== 'string') {
        throw new NetworkError(
          `No transaction response from ${methodName} (RPC or signer may have failed before broadcast)`,
          rpcUrl,
          null
        );
      }
      log.debug('tx submitted', { hash: tx.hash });

      // Wait for transaction receipt
      const receipt = await tx.wait();
      if (receipt == null || typeof receipt.hash !== 'string') {
        throw new NetworkError(
          `No receipt returned for ${methodName} (hash ${tx.hash})`,
          rpcUrl,
          null
        );
      }
      log.info('Write succeeded', { methodName, hash: receipt.hash });

      // Parse events if provided
      const parsedEvents = {};
      if (parseEvents.length > 0) {
        for (const { eventDef, contract } of parseEvents) {
          const eventName = eventDef.eventName || eventDef.name || 'Unknown';
          const eventData = parseEventFromReceipt(eventDef, receipt, contract);

          if (requireEvents && !eventData) {
            log.warn('Expected event not found in receipt', { eventName, receiptHash: receipt.hash });
            throw new EventNotFoundError(eventName, receipt.hash);
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
      log.debug('--------------------------------');

      // If the error is a WalletError, throw it
      if (error instanceof WalletError) {
        log.debug('WalletError received in SapphireWriteWrapper.execute');
        throw error;
      }
      log.debug('Error is not a WalletError');

      /** @type {Record<string, unknown>} */
      let enrich = {};
      const err = /** @type {Error & { code?: string; receipt?: import('ethers').TransactionReceipt }} */ (error);
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

      throw SapphireWriteWrapper._translateError(methodName, err, {
        rpcUrl,
        ...enrich,
        revertInterface
      });
    }
  }

  /**
   * Best-effort nested JSON-RPC message (e.g. Sapphire "attestation required").
   *
   * @private
   * @param {Error} err
   * @returns {string | null}
   */
  static _nestedRpcMessage(err) {
    const info = /** @type {{ error?: { message?: string } }} */ (err).info;
    const nested = info?.error?.message;
    return typeof nested === 'string' && nested.length > 0 ? nested : null;
  }

  /**
   * Translate provider/contract errors to SDK errors
   *
   * @private
   * @param {string} methodName - Name of the method that threw the error
   * @param {Error} err - Original error
   * @param {Record<string, unknown>} context - Additional context (optional)
   * @returns {WalletError} Wrapped error with descriptive message
   */
  static _translateError(methodName, err, context = {}) {
    const message = err.message || String(err);

    const errorCode = /** @type {Error & { code?: string }} */ (err).code || /** @type {any} */ (err).error?.code;
    /** @type {string | undefined} */
    const action = typeof /** @type {any} */ (err).action === 'string' ? /** @type {any} */ (err).action : undefined;
    const nestedRpc = SapphireWriteWrapper._nestedRpcMessage(err);

    if (errorCode === 'CALL_EXCEPTION' || errorCode === 'UNPREDICTABLE_GAS_LIMIT') {
      const receipt = /** @type {import('ethers').TransactionReceipt | null | undefined} */ (
        context.receipt ?? /** @type {any} */ (err).receipt
      );
      const txHash =
        (typeof context.transactionHash === 'string' && context.transactionHash) ||
        (receipt && typeof receipt.hash === 'string' ? receipt.hash : null);

      if (txHash && receipt) {
        /** @type {import('ethers').Interface | null | undefined} */
        const iface = /** @type {any} */ (context).revertInterface;
        let revertData =
          (typeof context.revertData === 'string' && context.revertData) ||
          SapphireWriteWrapper._extractRpcRevertBytes(err) ||
          /** @type {any} */ (err).data ||
          null;
        let revertReason =
          (typeof context.revertReason === 'string' && context.revertReason) ||
          /** @type {any} */ (err).reason ||
          null;

        if (!/** @type {any} */ (err).reason && /** @type {any} */ (err).revert?.name) {
          revertReason = /** @type {any} */ (err).revert.name;
        }

        /** @type {unknown} */
        let revertArgsOut = context.revertArgs;
        if (revertData && !revertReason && iface) {
          const decoded = SapphireWriteWrapper._decodeCustomError(iface, revertData);
          revertReason = decoded.revertReason;
          if (decoded.revertArgs != null && revertArgsOut == null) {
            revertArgsOut = decoded.revertArgs;
          }
        }

        /** @type {Record<string, unknown>} */
        const extra = {};
        if (revertArgsOut != null) {
          extra.revertArgs = revertArgsOut;
        }

        const summary = revertReason ? `Transaction reverted: ${revertReason}` : `Transaction reverted: ${message}`;

        return new ContractRevertError(
          summary,
          revertData,
          revertReason,
          txHash,
          receipt,
          extra
        );
      }

      const actionPart = action ? ` (${action})` : '';
      const detail = nestedRpc && nestedRpc !== message ? `${message}: ${nestedRpc}` : message;
      return new NetworkError(
        `RPC call failed${actionPart} during ${methodName}: ${detail}`,
        /** @type {string | null} */ (context.rpcUrl ?? null),
        err
      );
    }

    if (errorCode === 'NETWORK_ERROR' || errorCode === 'TIMEOUT' || errorCode === 'SERVER_ERROR' ||
        errorCode === 'UNKNOWN_ERROR' || err.name === 'NetworkError') {
      return new NetworkError(
        `Network error: ${message} during ${methodName}`,
        /** @type {string | null} */ (context.rpcUrl ?? null),
        err
      );
    }

    const contextWithoutIface = { ...context };
    delete contextWithoutIface.revertInterface;
    return new WalletError(
      `Failed during ${methodName}: ${message}`,
      'UNKNOWN_ERROR',
      { methodName, ...contextWithoutIface, originalError: message, originalCode: errorCode }
    );
  }
}

export default SapphireWriteWrapper;
