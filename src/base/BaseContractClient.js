/**
 * Common base class for every contract client in the SDK
 * ({@code WalletFactoryClient}, {@code KeyVaultClient}, {@code WalletLogicClient}, the four
 * authenticator clients).
 *
 * Composes a {@link ContractRegistry} (lazy contract instance creation, write-signer guards) with an
 * {@link ExecutionPipeline} (Sapphire write flow, revert decoding, error translation through
 * {@code sdkErrorPipeline}). Subclasses call {@link BaseContractClient#executeRead} and
 * {@link BaseContractClient#executeWrite} so that error handling, sanitisation, and event parsing
 * are uniform across the SDK.
 *
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').BaseTransactionResult} BaseTransactionResult
 * @typedef {import('../types/index.js').ExecuteReadInputOptions} ExecuteReadInputOptions
 * @typedef {import('../types/index.js').ExecuteWriteInputOptions} ExecuteWriteInputOptions
 *
 * @module base/BaseContractClient
 */

import ContractRegistry from './ContractRegistry.js';
import ExecutionPipeline from './ExecutionPipeline.js';

/**
 * @public
 */
class BaseContractClient {
  /**
   * Wire a contract client with its read provider, optional write signer, and resolved network config.
   *
   * @public
   * @param {EthersProvider} readProvider - Ethers provider used for {@code executeRead}-backed view calls
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped signer for write operations ({@code null} for read-only clients)
   * @param {NetworkConfig} config - Resolved network configuration ({@code rpcUrl}, {@code chainId}, {@code addresses})
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
   * Build (or fetch from the registry's cache) a read-only contract instance bound to {@link readProvider}.
   *
   * @public
   * @template TContract
   * @param {(provider: EthersProvider, address: string) => TContract} contractGetter - Factory function from {@code src/contracts/*}
   * @param {Address} contractAddress - Address of the deployed contract
   * @returns {TContract} Read-bound contract instance
   * @throws {ValidationError} If {@code contractAddress} is missing or not a valid address
   */
  getReadContract(contractGetter, contractAddress) {
    return this._registry.getReadContract(contractGetter, contractAddress);
  }

  /**
   * Build (or fetch from the registry's cache) a write-capable contract instance bound to {@link writeSigner}.
   *
   * @public
   * @template TContract
   * @param {(signer: WrappedEthersSigner, address: string) => TContract} contractGetter - Factory function from {@code src/contracts/*}
   * @param {Address} contractAddress - Address of the deployed contract
   * @returns {TContract} Write-bound contract instance
   * @throws {ValidationError} If {@code contractAddress} is missing or not a valid address
   * @throws {WriteRequiresSignerError} If no write signer is configured on the client
   */
  getWriteContract(contractGetter, contractAddress) {
    return this._registry.getWriteContract(contractGetter, contractAddress);
  }

  /**
   * Execute an ethers contract read inside the SDK's error pipeline.
   *
   * Strips {@code operation}, {@code methodName} and {@code revertInterface} from {@code options} and
   * forwards everything else as sanitised error context. Optional {@code revertInterface} improves decoding
   * of custom Solidity errors when ethers does not fill {@code err.revert}.
   *
   * @public
   * @async
   * @template TResult
   * @param {ExecuteReadInputOptions} options - Read operation, method name, and any extra fields for the error context
   * @returns {Promise<TResult>} Resolves with whatever {@code operation} returned
   * @throws {NetworkError} If the underlying RPC transport fails
   * @throws {ContractRevertError} If the contract reverts (custom error or {@code Error(string)})
   * @throws {WalletError} For any other failure that is translated through the SDK error pipeline
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
   * Execute an ethers contract write inside the SDK's error pipeline (tx → receipt → events).
   *
   * Strips {@code operation}, {@code methodName}, {@code parseEvents}, {@code requireEvents}, {@code extraData}
   * and {@code revertInterface} from {@code options}; everything else becomes sanitised error context.
   *
   * @public
   * @async
   * @template {BaseTransactionResult} TResult
   * @param {ExecuteWriteInputOptions} options - Write operation, method name, parse-event spec, extra fields
   * @returns {Promise<TResult>} {@link BaseTransactionResult} merged with parsed events and {@code extraData}
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC transport fails (broadcast or receipt fetch)
   * @throws {ContractRevertError} If the transaction reverts on-chain (revert data is decoded via {@code revertInterface} when supplied)
   * @throws {EventNotFoundError} If {@code requireEvents !== false} and a required parsed event is missing from the receipt
   * @throws {EventParseError} If a matching event log is found but cannot be decoded/mapped
   * @throws {WalletError} For any other failure that is translated through the SDK error pipeline
   *
   * @remarks
   * {@link ExecuteWriteOptions} describes {@code requireEvents}: {@code false} suppresses missing-event failures only;
   * invalid event definitions and decode/mapping errors after a matching log still throw.
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
