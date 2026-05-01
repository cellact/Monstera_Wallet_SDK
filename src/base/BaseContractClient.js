/**
 * BaseContractClient
 * 
 * Base class for all contract clients providing common functionality:
 * - Contract instance management (read/write)
 * - Transaction sending with event parsing
 * - Error wrapping
 * 
 * Validation helpers are available via delegation to assert.js
 * 
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').BaseTransactionResult} BaseTransactionResult
 * @typedef {import('../types/index.js').ExecuteReadInputOptions} ExecuteReadInputOptions
 * @typedef {import('../types/index.js').ExecuteWriteInputOptions} ExecuteWriteInputOptions
 */

import SapphireWriteWrapper from './SapphireWriteWrapper.js';
import { requireAddress } from '../internal/assert.js';
import MonsteraConfig from '../config/monstera.js';
import { WriteRequiresSignerError } from '../errors/index.js';
import { rethrowExecuteError } from '../errors/pipeline.js';
import log from '../internal/logger.js';

class BaseContractClient {
  // ============================================================================
  // Constructor
  // ============================================================================
  
  /**
   * @param {EthersProvider} readProvider - Ethers provider for read operations
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped signer for write operations (null for read-only clients)
   * @param {NetworkConfig} config - Configuration object
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
   * @template TContract
   * @param {(provider: EthersProvider, address: string) => TContract} contractGetter
   * @param {Address} contractAddress
   * @returns {TContract}
   */
  getReadContract(contractGetter, contractAddress) {
    requireAddress(contractAddress, 'address');
    log.debug('getReadContract', { contractAddress });
    return contractGetter(this.readProvider, contractAddress);
  }

  /**
   * Get contract instance for write operations
   * 
   * Validates the address and returns a contract instance for write operations.
   * 
   * @template TContract
   * @param {(signer: WrappedEthersSigner, address: string) => TContract} contractGetter
   * @param {Address} contractAddress
   * @returns {TContract}
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   */
  getWriteContract(contractGetter, contractAddress) {
    requireAddress(contractAddress, 'address');
    log.debug('getWriteContract', { contractAddress });
    if (!this.writeSigner) {
      log.warn('Write signer missing, throwing WriteRequiresSignerError', {});
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
   * Any additional properties in options (besides operation, methodName, revertInterface)
   * are included in the error context. Optional {@code revertInterface} improves decoding
   * of custom errors on {@code CALL_EXCEPTION} when ethers does not fill {@code err.revert}.
   * 
   * @template TResult
   * @param {ExecuteReadInputOptions} options - Complete options for the read operation
   * @returns {Promise<TResult>}
   * 
   * @example
   * return this.executeRead({
   *   operation: () => contract.method(),
   *   methodName: 'method name',
   *   keyVaultAddr: '0x...' // included in error context
   * });
   */
  async executeRead(options) {
    const { operation, methodName, revertInterface, ...errorContext } = options;
    const sdkContext = this.buildErrorContext({ ...errorContext, methodName });

    log.info('Executing read', { methodName });
    try {
      return await operation();
    } catch (error) {
      rethrowExecuteError(error, {
        methodName,
        rpcUrl: this.config?.rpcUrl,
        revertInterface: revertInterface ?? undefined,
        sdkContext
      });
    }
  }

  /**
   * Execute a write operation with automatic error handling
   * 
   * Reduces boilerplate by automatically handling transaction sending and error wrapping.
   * Use this for all write operations to ensure consistent error handling.
   * 
   * Any additional properties in options (besides operation, methodName, parseEvents, requireEvents, extraData) 
   * are included in the error context.
   * 
   * @template TResult extends BaseTransactionResult
   * @param {ExecuteWriteInputOptions} options - Complete options for the write operation
   * @returns {Promise<TResult>}
   * 
   * @example
   * return this.executeWrite({
   *   operation: () => contract.method(),
   *   methodName: 'method name',
   *   parseEvents: [...],
   *   extraData: {...},
   *   walletAddress: '0x...' // included in error context
   * });
   */
  async executeWrite(options) {
    const { operation, methodName, parseEvents, requireEvents, extraData, revertInterface, ...errorContext } = options;

    log.info('Executing write', { methodName });
    const sdkContext = this.buildErrorContext({ ...errorContext, methodName });

    try {
      return await SapphireWriteWrapper.execute(operation, {
        writeSigner: this.writeSigner,
        readProvider: this.readProvider,
        revertInterface: revertInterface ?? undefined,
        parseEvents,
        requireEvents,
        extraData,
        methodName,
        rpcUrl: this.config?.rpcUrl,
        sdkContext
      });
    } catch (error) {
      rethrowExecuteError(error, {
        methodName,
        rpcUrl: this.config?.rpcUrl,
        revertInterface: revertInterface ?? undefined,
        sdkContext
      });
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
   * @param {Record<string, unknown>} options - Method options object (may include contract addresses, etc.)
   * @returns {Record<string, unknown>} Standardized context object
   */
  buildErrorContext(options = {}) {
    const context = {};
    
    // Exclude sensitive parameters that should never appear in error context
    const sensitiveParams = MonsteraConfig.SENSITIVE_PARAMS || [];
  
    // Include all parameters except sensitive ones
    for (const [key, value] of Object.entries(options)) {
      if (!sensitiveParams.includes(key)) {
        context[key] = value;
      }
    }
    
    // Include client name for better debugging
    context.client = this.constructor.name;
    
    return context;
  }

}

export default BaseContractClient;
