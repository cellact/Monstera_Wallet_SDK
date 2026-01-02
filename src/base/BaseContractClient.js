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

// Internal base classes
import SapphireWriteWrapper from './SapphireWriteWrapper.js';

// Internal utilities
import { requireAddress } from '../internal/assert.js';

// Internal errors
import { WalletError, WriteRequiresSignerError } from '../errors/index.js';

class BaseContractClient {
  // ============================================================================
  // Constructor
  // ============================================================================
  
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

  // ============================================================================
  // Contract Getters
  // ============================================================================

  /**
   * Get contract instance for read operations
   * 
   * Validates the address and returns a contract instance for read operations.
   * 
   * @param {Function} contractGetter - Function to get contract (e.g., getWalletFactoryContract)
   * @param {String} contractAddress - Contract address (will be validated)
   * @returns {Object} Contract instance
   */
  getReadContract(contractGetter, contractAddress) {
    requireAddress(contractAddress, 'address');
    return contractGetter(this.readProvider, contractAddress);
  }

  /**
   * Get contract instance for write operations
   * 
   * Validates the address and returns a contract instance for write operations.
   * 
   * @param {Function} contractGetter - Function to get contract (e.g., getWalletFactoryContract)
   * @param {String} contractAddress - Contract address (will be validated)
   * @returns {Object} Contract instance
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   */
  getWriteContract(contractGetter, contractAddress) {
    requireAddress(contractAddress, 'address');
    if (!this.writeSigner) {
      throw new WriteRequiresSignerError('write operation');
    }
    return contractGetter(this.writeSigner, contractAddress);
  }

  // ============================================================================
  // Execute Helpers
  // ============================================================================

  /**
   * Execute a read operation with automatic error handling
   * 
   * Reduces boilerplate by automatically wrapping errors with context.
   * Use this for all read operations to ensure consistent error handling.
   * 
   * @param {Function} operation - Async function to execute (e.g., () => contract.method())
   * @param {String} methodName - Name of the method for error context
   * @param {Object} [options={}] - Options object for error context
   * @returns {Promise<*>} Operation result
   * 
   * @example
   * // Before:
   * try {
   *   const result = await contract.method();
   *   return result;
   * } catch (error) {
   *   throw this.wrapError('method name', error, options);
   * }
   * 
   * // After:
   * return this.executeRead(
   *   () => contract.method(),
   *   'method name',
   *   options
   * );
   */
  async executeRead(operation, methodName, options = {}) {
    try {
      return await operation();
    } catch (error) {
      throw this.wrapError(methodName, error, options);
    }
  }

  /**
   * Execute a write operation with automatic error handling
   * 
   * Reduces boilerplate by automatically handling transaction sending and error wrapping.
   * Use this for all write operations to ensure consistent error handling.
   * 
   * @param {Function} operation - Async function that returns transaction (e.g., () => contract.method())
   * @param {String} methodName - Name of the method for error context
   * @param {Object} [options={}] - Transaction and error context options
   * @param {Array<Object>} [options.parseEvents] - Array of event definitions to parse
   * @param {Boolean} [options.requireEvents=true] - Whether to throw if events are not found
   * @param {Object} [options.extraData] - Additional data to include in result
   * @returns {Promise<Object>} Transaction result with receipt and parsed events
   * 
   * @example
   * return this.executeWrite(
   *   () => contract.method(),
   *   'method name',
   *   { parseEvents: [...], extraData: {...}, ...options }
   * );
   */
  async executeWrite(operation, methodName, options = {}) {
    const { parseEvents, requireEvents, extraData, ...errorContext } = options;
    
    try {
      return await SapphireWriteWrapper.execute(operation, {
        writeSigner: this.writeSigner,
        parseEvents,
        requireEvents,
        extraData,
        methodName,
        rpcUrl: this.config?.rpcUrl
      });
    } catch (error) {
      throw this.wrapError(methodName, error, errorContext);
    }
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

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

export default BaseContractClient;
