/**
 * BaseContractClient
 * 
 * Base class for all contract clients providing common functionality:
 * - Contract instance management (read/write)
 * - Transaction sending with event parsing
 * - Error wrapping
 * 
 * Validation helpers are available via delegation to assert.js
 */

const { parseEventFromReceipt } = require('../events');
const {
  WalletError,
  ValidationError,
  NetworkError,
  ContractRevertError,
  EventNotFoundError,
  WriteRequiresSignerError
} = require('../errors');

class BaseContractClient {
  /**
   * @param {Object} readProvider - Ethers provider for read operations
   * @param {Object} writeSigner - Ethers signer for write operations
   * @param {Object} config - Configuration object
   */
  constructor(readProvider, writeSigner, config) {
    this.readProvider = readProvider;
    this.writeSigner = writeSigner;
    this.config = config;
  }

  /**
   * Get contract instance for read or write operations
   * 
   * @param {'read'|'write'} mode - Operation mode
   * @param {Function} contractGetter - Function to get contract (e.g., getWalletFactoryContract)
   * @param {String} contractAddress - Contract address
   * @returns {Object} Contract instance
   */
  contract(mode, contractGetter, contractAddress) {
    if (mode === 'read') {
      return contractGetter(this.readProvider, contractAddress);
    } 
    
    if (mode === 'write') {
      if (!this.writeSigner) {
        throw new WriteRequiresSignerError('write operation');
      }
      return contractGetter(this.writeSigner, contractAddress);
    }

    throw new ValidationError(
      `Invalid contract mode: ${mode}. Must be 'read' or 'write'`,
      'mode',
      mode
    );
  }

  /**
   * Send a transaction and optionally parse events
   * 
   * @param {Function} txFn - Function that returns a transaction promise (e.g., () => contract.method(...))
   * @param {Object} options - Transaction options
   * @param {Array<Object>} [options.parseEvents] - Array of event definitions to parse: [{ eventDef, contract }]
   * @param {Boolean} [options.requireEvents=true] - Whether to throw if events are not found
   * @param {Object} [options.extraData] - Additional data to include in result
   * @returns {Promise<Object>} Transaction result with receipt and parsed events
   */
  async sendTx(txFn, options = {}) {

    if (!this.writeSigner) {
      throw new WriteRequiresSignerError('send transaction');
    }

    const { parseEvents = [], requireEvents = true, extraData = {} } = options;

    try {
      // Execute transaction function
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

      // Build result - spread event data directly into result object
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
      // Wrap other errors
      throw this.wrapError('send transaction', error, { transactionHash: error.transactionHash });
    }
  }

  /**
   * Wrap an error with method name and context
   * 
   * Intelligently categorizes errors and returns appropriate WalletError type.
   * 
   * @param {String} methodName - Name of the method that threw the error
   * @param {Error} err - Original error
   * @param {Object} context - Additional context (optional)
   * @returns {WalletError} Wrapped error with descriptive message
   */
  wrapError(methodName, err, context = {}) {
    // If already a WalletError, just add context
    if (err instanceof WalletError) {
      Object.assign(err.context, { methodName, ...context });
      return err;
    }
    
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
        this.config?.rpcUrl,
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

module.exports = BaseContractClient;
