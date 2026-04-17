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
      rpcUrl = null
    } = options;

    // Validate signer is provided
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
          
          // Spread event data directly into result (matching existing pattern)
          if (eventData) {
            Object.assign(parsedEvents, eventData);
          }
        }
      }

      // Build normalized result - spread event data directly into result object
      const result = {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        ...parsedEvents,
        ...extraData
      };

      return result;
    } catch (error) {
      // Log only non-sensitive error metadata before translation.
      log.debug('Write failed before error translation', {
        methodName,
        errorName: error?.name,
        errorCode: error?.code ?? error?.error?.code,
        errorMessage: error?.message
      });
      // Re-throw WalletError as-is
      if (error instanceof WalletError) {
        log.debug('Re-throwing WalletError');
        throw error;
      }
      
      log.debug('Translating error to WalletError');
      // Translate provider/contract errors to SDK errors
      throw SapphireWriteWrapper._translateError(methodName, error, { rpcUrl });
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
    
    // Detect error types from ethers/contract errors
    // Ethers error codes: https://docs.ethers.org/v6/api/providers/#errors
    const errorCode = err.code || err.error?.code;
    /** @type {string | undefined} */
    const action = typeof err.action === 'string' ? err.action : undefined;
    const nestedRpc = SapphireWriteWrapper._nestedRpcMessage(err);

    if (errorCode === 'CALL_EXCEPTION' || errorCode === 'UNPREDICTABLE_GAS_LIMIT') {
      const receipt = /** @type {Record<string, unknown> | null | undefined} */ (
        context.receipt ?? err.receipt
      );
      const txHash =
        (typeof context.transactionHash === 'string' && context.transactionHash) ||
        (receipt && typeof receipt.hash === 'string' ? receipt.hash : null);

      // Receipt + hash → transaction was included; surface as on-chain revert
      if (txHash && receipt) {
        return new ContractRevertError(
          `Transaction reverted: ${message}`,
          err.data,
          err.reason,
          txHash,
          receipt
        );
      }

      // eth_call / estimateGas / Sapphire cipher fetch — no mined tx
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
      // Network/RPC error
      return new NetworkError(
        `Network error: ${message} during ${methodName}`,
        context.rpcUrl,
        err
      );
    }
    
    // Generic WalletError with method context
    return new WalletError(
      `Failed during ${methodName}: ${message}`,
      'UNKNOWN_ERROR',
      { methodName, ...context, originalError: message, originalCode: errorCode }
    );
  }
}

export default SapphireWriteWrapper;
