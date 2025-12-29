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

const { WriteRequiresSignerError, WalletError } = require('../errors');
const SapphireWriteWrapper = require('./SapphireWriteWrapper');

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
   * Get contract instance for read operations
   * 
   * @param {Function} contractGetter - Function to get contract (e.g., getWalletFactoryContract)
   * @param {String} contractAddress - Contract address
   * @returns {Object} Contract instance
   */
  getReadContract(contractGetter, contractAddress) {
    return contractGetter(this.readProvider, contractAddress);
  }

  /**
   * Get contract instance for write operations
   * 
   * @param {Function} contractGetter - Function to get contract (e.g., getWalletFactoryContract)
   * @param {String} contractAddress - Contract address
   * @returns {Object} Contract instance
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   */
  getWriteContract(contractGetter, contractAddress) {
    if (!this.writeSigner) {
      throw new WriteRequiresSignerError('write operation');
    }
    return contractGetter(this.writeSigner, contractAddress);
  }

  /**
   * Send a transaction and optionally parse events
   * 
   * Delegates to SapphireWriteWrapper to ensure all writes go through
   * the centralized execution path with encryption and error translation.
   * 
   * @param {Function} txFn - Function that returns a transaction promise (e.g., () => contract.method(...))
   * @param {Object} options - Transaction options
   * @param {Array<Object>} [options.parseEvents] - Array of event definitions to parse: [{ eventDef, contract }]
   * @param {Boolean} [options.requireEvents=true] - Whether to throw if events are not found
   * @param {Object} [options.extraData] - Additional data to include in result
   * @returns {Promise<Object>} Transaction result with receipt and parsed events
   */
  async sendTx(txFn, options = {}) {
    // Delegate to SapphireWriteWrapper for centralized execution
    return SapphireWriteWrapper.execute(txFn, {
      writeSigner: this.writeSigner,
      parseEvents: options.parseEvents,
      requireEvents: options.requireEvents,
      extraData: options.extraData,
      methodName: 'send transaction',
      rpcUrl: this.config?.rpcUrl
    });
  }

  /**
   * Wrap an error with method name and context
   * 
   * Delegates to SapphireWriteWrapper for consistent error translation.
   * This method is kept for backward compatibility and for non-write errors.
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
    
    // Use SapphireWriteWrapper's error translation for consistency
    return SapphireWriteWrapper._translateError(methodName, err, {
      ...context,
      rpcUrl: this.config?.rpcUrl
    });
  }
}

module.exports = BaseContractClient;
