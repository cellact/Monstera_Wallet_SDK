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
 */

import { parseEventFromReceipt } from '../events/index.js';
import {
  WalletError,
  NetworkError,
  ContractRevertError,
  EventNotFoundError,
  WriteRequiresSignerError
} from '../errors/index.js';

class SapphireWriteWrapper {
  /**
   * Execute a write transaction through Sapphire-wrapped signer
   * 
   * @param {Function} txFn - Function that returns a transaction promise (e.g., () => contract.method(...))
   * @param {Object} options - Execution options
   * @param {Object} options.writeSigner - The write signer (must be Sapphire-wrapped)
   * @param {Array<Object>} [options.parseEvents] - Array of event definitions to parse: [{ eventDef, contract }]
   * @param {Boolean} [options.requireEvents=true] - Whether to throw if events are not found
   * @param {Object} [options.extraData] - Additional data to include in result
   * @param {String} [options.methodName] - Method name for error context
   * @returns {Promise<Object>} Transaction result with receipt and parsed events
   */
  static async execute(txFn, options = {}) {
    const {
      writeSigner,
      parseEvents = [],
      requireEvents = true,
      extraData = {},
      methodName = 'execute transaction'
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
      
      // Wait for transaction receipt
      const receipt = await tx.wait();

      // Parse events if provided
      const parsedEvents = {};
      if (parseEvents.length > 0) {
        for (const { eventDef, contract } of parseEvents) {
          const eventName = eventDef.eventName || eventDef.name || 'Unknown';
          const eventData = parseEventFromReceipt(eventDef, receipt, contract);
          
          if (requireEvents && !eventData) {
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
      // Re-throw WalletError as-is
      if (error instanceof WalletError) {
        throw error;
      }
      
      // Translate provider/contract errors to SDK errors
      throw SapphireWriteWrapper._translateError(methodName, error);
    }
  }

  /**
   * Translate provider/contract errors to SDK errors
   * 
   * @private
   * @param {String} methodName - Name of the method that threw the error
   * @param {Error} err - Original error
   * @param {Object} context - Additional context (optional)
   * @returns {WalletError} Wrapped error with descriptive message
   */
  static _translateError(methodName, err, context = {}) {
    const message = err.message || String(err);
    
    // Detect error types from ethers/contract errors
    // Ethers error codes: https://docs.ethers.org/v6/api/providers/#errors
    const errorCode = err.code || err.error?.code;
    
    if (errorCode === 'CALL_EXCEPTION' || errorCode === 'UNPREDICTABLE_GAS_LIMIT') {
      // Contract revert
      return new ContractRevertError(
        `Transaction reverted: ${message}`,
        context.transactionHash || err.transactionHash,
        context.receipt || err.receipt
      );
    }
    
    if (errorCode === 'NETWORK_ERROR' || errorCode === 'TIMEOUT' || errorCode === 'SERVER_ERROR' || 
        errorCode === 'UNKNOWN_ERROR' || err.name === 'NetworkError') {
      // Network/RPC error
      return new NetworkError(
        `Network error: ${message}`,
        context.rpcUrl,
        err
      );
    }
    
    // Generic WalletError with method context
    return new WalletError(
      `Failed to ${methodName}: ${message}`,
      'UNKNOWN_ERROR',
      { methodName, ...context, originalError: message, originalCode: errorCode }
    );
  }
}

export default SapphireWriteWrapper;
