/**
 * KeyVaultClient
 * 
 * Client for interacting with KeyVault contract methods.
 * Handles key vault operations, signing, and account management.
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').SignTransactionOptions} SignTransactionOptions
 * @typedef {import('../../types/index.js').SignMessageOptions} SignMessageOptions
 * @typedef {import('../../types/index.js').SignHashOptions} SignHashOptions
 * @typedef {import('../../types/index.js').InitializeOptions} InitializeOptions
 * @typedef {import('../../types/index.js').UpdateAuthenticatorOptions} UpdateAuthenticatorOptions
 * @typedef {import('../../types/index.js').InitializeResult} InitializeResult
 * @typedef {import('../../types/index.js').UpdateAuthenticatorAddrResult} UpdateAuthenticatorAddrResult
 * @typedef {import('../../types/index.js').UpdateKeyVaultImplAddrResult} UpdateKeyVaultImplAddrResult
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes} Bytes
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getKeyVaultContract } from '../../contracts/core/keyVault.js';
import { KeyVaultEvents } from '../../events/index.js';
import { requireAddress, requireBytes, requireNonNegativeInteger } from '../../internal/assert.js';

class KeyVaultClient extends BaseContractClient {
  // ============================================================================
  // Constructor
  // ============================================================================
  
  /**
   * @param {EthersProvider} readProvider - Ethers provider for read operations
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped signer for write operations (null for read-only clients)
   * @param {NetworkConfig} config - Configuration object
   */
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Get the storage contract address holding the keys
   * 
   * @param {Record<string, unknown>} options - Get storage address options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getStorageAddr(options = {}) {
    const { keyVaultAddr } = options;
    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.storage_(),
        methodName: 'get storage address',
        ...options
      }
    );
  }

  /**
   * Get the current authenticator contract address for a wallet 
   * 
   * @param {Record<string, unknown>} options - Get authenticator options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Address>} Authenticator address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getAuthenticatorAddr(options = {}) {
    const { keyVaultAddr } = options;
    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead( 
      {
        operation: () => keyVault.authenticator(),
        methodName: 'get authenticator',
        ...options
      }
    );
  }

  /**
   * Get the current KeyVaultImplementation contract address
   * 
   * @param {Record<string, unknown>} options - Get implementation options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Address>} Implementation address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getKeyVaultImplAddr(options = {}) {
    const { keyVaultAddr } = options;
    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.implementation(),
        methodName: 'get key vault implementation',
        ...options
      }
    );
  }

  /**
   * Check if a given keyVault is initialized 
   * 
   * @param {Record<string, unknown>} options - Check if keyVault is initialized options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<boolean>} True if keyVault is initialized, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isInitialized(options = {}) {
    const { keyVaultAddr } = options;
    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.initialized(),
        methodName: 'check if key vault is initialized',
        ...options
      }
    );
  }

  /**
   * Get one of a wallet's account addresses for a given index
   * 
   * @param {Record<string, unknown>} options - Get account address options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {number} options.index - Account index (uint32)
   * @returns {Promise<Address>} Account address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid, or if index is invalid
   */
  async getAccountAddr(options = {}) {
    const { keyVaultAddr, index } = options;
    requireNonNegativeInteger(index, 'index');

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.getAccountAddress(index),
        methodName: 'get account address',
        ...options
      }
    );
  }

  /**
   * Get multiple account addresses from a wallet for a given range of indexes
   * 
   * @param {Record<string, unknown>} options - Get account addresses options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {number} options.fromIndex - From index (uint32)
   * @param {number} options.count - Count (uint32)
   * @returns {Promise<Address[]>} Array of account addresses
   * @throws {ValidationError} If keyVaultAddr is missing or invalid, or if fromIndex/count are invalid
   */
  async getAccountAddresses(options = {}) {
    const { keyVaultAddr, fromIndex, count } = options;
    requireNonNegativeInteger(fromIndex, 'fromIndex');
    requireNonNegativeInteger(count, 'count');

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);
    
    return this.executeRead(
      {
        operation: () => keyVault.getAccountAddresses(fromIndex, count),
        methodName: 'get account addresses',
        ...options
      }
    );
  }

  /**
   * Sign a raw transaction (authenticated function)
   * 
   * @param {SignTransactionOptions} options - Sign transaction options
   * @returns {Promise<Bytes>} Signed transaction
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signTransaction(options = {}) {
    const { keyVaultAddr, authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireNonNegativeInteger(nonce, 'nonce');
    requireNonNegativeInteger(gasPrice, 'gasPrice');
    requireNonNegativeInteger(gasLimit, 'gasLimit');
    requireAddress(to, 'to');
    requireNonNegativeInteger(value, 'value');
    requireBytes(txData, 'txData');
    requireNonNegativeInteger(chainId, 'chainId');

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId),
        methodName: 'sign transaction',
        ...options
      }
    );
  }

  /**
   * Sign an EIP-191 message (authenticated function)
   * 
   * @param {SignMessageOptions} options - Sign message options
   * @returns {Promise<Bytes>} Signed message (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signMessage(options = {}) {
    const { keyVaultAddr, authProof, index, message } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(message, 'message');

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.signMessage(authProof, index, message),
        methodName: 'sign message',
        ...options
      }
    );
  }

  /**
   * Sign a 32-byte hash (authenticated function)
   * 
   * @param {SignHashOptions} options - Sign hash options
   * @returns {Promise<Bytes>} Signed hash (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async sign(options = {}) {
    const { keyVaultAddr, authProof, index, hash } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(hash, 'hash');

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.sign(authProof, index, hash),
        methodName: 'sign hash',
        ...options
      }
    );
  }

  /**
   * Execute a function with an auth proof (authenticated function)
   * 
   * @param {Record<string, unknown>} options - Execute function options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {Bytes} options.implCall - Implementation call (bytes)
   * @returns {Promise<Bytes>} Execute function result (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async executeWithAuth(options = {}) {
    const { keyVaultAddr, authProof, implCall } = options;
    requireBytes(authProof, 'authProof');
    requireBytes(implCall, 'implCall');

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      {
        operation: () => keyVault.executeWithAuth(authProof, implCall),
        methodName: 'execute with auth',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Initialize a KeyVault contract
   * 
   * @param {InitializeOptions} options - Initialize key vault options
   * @returns {Promise<InitializeResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async initialize(options = {}) {
    const { keyVaultAddr, storageAddr, authenticatorAddr, accessToken } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(storageAddr, 'storageAddr');
    requireAddress(authenticatorAddr, 'authenticatorAddr');
    requireBytes(accessToken, 'accessToken');

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite({
      operation: () => keyVault.initialize(storageAddr, authenticatorAddr, accessToken),
      methodName: 'initialize key vault',
      ...options
    });
  }

  /**
   * Update the keyVaultImplementation contract address (authenticated function)
   * 
   * @param {Record<string, unknown>} options - Update keyVaultImplementation options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {Address} options.newImplAddr - New keyVaultImplementation contract address
   * @returns {Promise<UpdateKeyVaultImplAddrResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateKeyVaultImplAddr(options = {}) {
    const { keyVaultAddr, authProof, newImplAddr } = options;
    requireBytes(authProof, 'authProof');
    requireAddress(newImplAddr, 'newImplAddr');

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite(
      {
        operation: () => keyVault.upgradeImplementation(authProof, newImplAddr),
        methodName: 'upgrade key vault implementation',
        parseEvents: [{
          eventDef: KeyVaultEvents.ImplementationUpgraded,
          contract: keyVault
        }],
        ...options
      }
    );
  }

  /**
   * Update the authenticator (Authenticated function)
   * 
   * @param {UpdateAuthenticatorOptions} options - Update authenticator options
   * @returns {Promise<UpdateAuthenticatorAddrResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateAuthenticatorAddr(options = {}) {
    const { keyVaultAddr, authProof, newAuthenticatorAddr, newAuthConfig } = options;
    requireBytes(authProof, 'authProof');
    requireAddress(newAuthenticatorAddr, 'newAuthenticatorAddr');
    requireBytes(newAuthConfig, 'newAuthConfig');

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite(
      {
        operation: () => keyVault.changeAuthenticator(authProof, newAuthenticatorAddr, newAuthConfig),
        methodName: 'change authenticator',
        parseEvents: [{
          eventDef: KeyVaultEvents.AuthenticatorChanged,
          contract: keyVault
        }],
        ...options
      }
    );
  }
}

export default KeyVaultClient;
