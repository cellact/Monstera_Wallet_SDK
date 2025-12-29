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
   * Build standardized error context from method parameters
   * 
   * Automatically includes relevant context for debugging:
   * - All input parameters (filtered for sensitive data) 
   * - Contract addresses and other context provided in options
   * 
   * @param {Object} options - Method options object (may include contract addresses, etc.)
   * @returns {Object} Standardized context object
   */
  buildErrorContext(options = {}) {
    const context = {};
    
    // Exclude sensitive parameters that should never appear in error context
    const sensitiveParams = [
      'authConfig', 'authProof', 'currentPassword', 'newPasswordHash',
      'seed', 'mnemonic', 'hookData', 'logicData', 'txData', 'data',
      'message', 'hash', 'privateKey', 'password'
    ];
    
    // Include all parameters except sensitive ones
    for (const key in options) {
      if (options.hasOwnProperty(key) && !sensitiveParams.includes(key)) {
        context[key] = options[key];
      }
    }
    
    // Include client name for better debugging
    context.client = this.constructor.name;
    
    return context;
  }

  /**
   * Wrap an error with method name and context
   * 
   * Delegates to SapphireWriteWrapper for consistent error translation.
   * Supports both new pattern (options object) and legacy pattern (context object).
   * 
   * @param {String} methodName - Name of the method that threw the error
   * @param {Error} err - Original error
   * @param {Object} optionsOrContext - Method options object (for automatic context extraction) or context object (legacy)
   * @returns {WalletError} Wrapped error with descriptive message
   */
  wrapError(methodName, err, optionsOrContext = {}) {
    // Build standardized context from options/context
    // Extract safe params and include any additional context provided
    const context = this.buildErrorContext(optionsOrContext);
    
    // Add method name to context
    context.methodName = methodName;
    
    // If already a WalletError, just add context
    if (err instanceof WalletError) {
      Object.assign(err.context, context);
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
