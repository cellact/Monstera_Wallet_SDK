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
    this.addresses = config.addresses;
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
    } else if (mode === 'write') {
      return contractGetter(this.writeSigner, contractAddress);
    } else {
      throw new Error(`Invalid contract mode: ${mode}. Must be 'read' or 'write'`);
    }
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
            throw new Error(`${eventName} event not found in transaction receipt`);
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
      throw error;
    }
  }

  /**
   * Wrap an error with method name and context
   * 
   * @param {String} methodName - Name of the method that threw the error
   * @param {Error} err - Original error
   * @param {Object} context - Additional context (optional)
   * @returns {Error} Wrapped error with descriptive message
   */
  wrapError(methodName, err, context = {}) {
    const contextStr = Object.keys(context).length > 0 
      ? ` (${Object.entries(context).map(([k, v]) => `${k}: ${v}`).join(', ')})`
      : '';
    
    const message = err.message || String(err);
    return new Error(`Failed to ${methodName}${contextStr}: ${message}`);
  }
}

module.exports = BaseContractClient;
