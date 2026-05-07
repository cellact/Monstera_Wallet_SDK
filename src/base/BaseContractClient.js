/**
 * BaseContractClient
 *
 * Base class for all contract clients: delegates contract wiring to
 * {@link ContractRegistry} and read/write execution to {@link ExecutionPipeline}.
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

import ContractRegistry from './ContractRegistry.js';
import ExecutionPipeline from './ExecutionPipeline.js';

class BaseContractClient {
  /**
   * @param {EthersProvider} readProvider - Ethers provider for read operations
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped signer for write operations (null for read-only clients)
   * @param {NetworkConfig} config - Configuration object
   */
  constructor(readProvider, writeSigner, config) {
    this.readProvider = readProvider;
    this.writeSigner = writeSigner;
    this.config = config;
    this._registry = new ContractRegistry(readProvider, writeSigner);
    this._pipeline = new ExecutionPipeline({
      readProvider,
      writeSigner,
      config
    });
  }

  /**
   * @template TContract
   * @param {(provider: EthersProvider, address: string) => TContract} contractGetter
   * @param {Address} contractAddress
   * @returns {TContract}
   */
  getReadContract(contractGetter, contractAddress) {
    return this._registry.getReadContract(contractGetter, contractAddress);
  }

  /**
   * @template TContract
   * @param {(signer: WrappedEthersSigner, address: string) => TContract} contractGetter
   * @param {Address} contractAddress
   * @returns {TContract}
   */
  getWriteContract(contractGetter, contractAddress) {
    return this._registry.getWriteContract(contractGetter, contractAddress);
  }

  /**
   * Execute a read operation with automatic error handling
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
   *   keyVaultAddr: '0x...'
   * });
   */
  async executeRead(options) {
    const { operation, methodName, revertInterface, ...errorContext } = options;
    return this._pipeline.executeRead(operation, {
      methodName,
      revertInterface,
      client: this.constructor.name,
      ...errorContext
    });
  }

  /**
   * Execute a write operation with automatic error handling
   *
   * Any additional properties in options (besides operation, methodName, parseEvents, requireEvents, extraData)
   * are included in the error context.
   *
   * @remarks
   * {@link ExecuteWriteOptions} describes {@code requireEvents}: {@code false} suppresses missing-event failures only;
   * invalid event definitions and decode/mapping errors after logs match still throw.
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
   *   walletAddress: '0x...'
   * });
   */
  async executeWrite(options) {
    const { operation, methodName, parseEvents, requireEvents, extraData, revertInterface, ...errorContext } =
      options;

    return this._pipeline.executeWrite(operation, {
      methodName,
      parseEvents,
      requireEvents,
      extraData,
      revertInterface,
      client: this.constructor.name,
      ...errorContext
    });
  }
}

export default BaseContractClient;
