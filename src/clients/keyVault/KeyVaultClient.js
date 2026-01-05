/**
 * KeyVaultClient
 * 
 * Client for interacting with KeyVault contract methods.
 * Handles key vault operations, signing, and account management.
 */

// Internal base classes
import BaseContractClient from '../../base/BaseContractClient.js';

// Internal contracts
import { getKeyVaultContract } from '../../contracts/core/keyVault.js';

// Internal events
import { KeyVaultEvents } from '../../events/index.js';

// Internal utilities
import { requireAddress, requireBytes, requireNonNegativeInteger } from '../../internal/assert.js';

class KeyVaultClient extends BaseContractClient {
  // ============================================================================
  // Constructor
  // ============================================================================
  
  /**
   * @param {Object} readProvider - Ethers provider for read operations
   * @param {Object} writeSigner - Ethers signer for write operations
   * @param {Object} config - Configuration object
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
   * @param {Object} options - Get storage address options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<String>} Storage contract address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getStorageAddr(options = {}) {
    const { keyVaultAddr } = options;
    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      () => keyVault.storage_(),
      'get storage address',
      options
    );
  }

  /**
   * Get the current authenticator contract address for a wallet 
   * 
   * @param {Object} options - Get authenticator options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<String>} Authenticator address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getAuthenticatorAddr(options = {}) {
    const { keyVaultAddr } = options;
    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      () => keyVault.authenticator(),
      'get authenticator',
      options
    );
  }

  /**
   * Get the current KeyVaultImplementation contract address
   * 
   * @param {Object} options - Get implementation options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<String>} Implementation address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getKeyVaultImplAddr(options = {}) {
    const { keyVaultAddr } = options;
    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      () => keyVault.implementation(),
      'get key vault implementation',
      options
    );
  }

  /**
   * Check if a given keyVault is initialized 
   * 
   * @param {Object} options - Check if keyVault is initialized options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Boolean>} True if keyVault is initialized, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isInitialized(options = {}) {
    const { keyVaultAddr } = options;
    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      () => keyVault.initialized(),
      'check if key vault is initialized',
      options
    );
  }

  /**
   * Get one of a wallet's account addresses for a given index
   * 
   * @param {Object} options - Get account address options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @param {Number} options.index - Account index (uint32)
   * @returns {Promise<String>} Account address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid, or if index is invalid
   */
  async getAccountAddr(options = {}) {
    const { keyVaultAddr, index } = options;
    requireNonNegativeInteger(index, 'index');

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);

    return this.executeRead(
      () => keyVault.getAccountAddress(index),
      'get account address',
      options
    );
  }

  /**
   * Get multiple account addresses from a wallet for a given range of indexes
   * 
   * @param {Object} options - Get account addresses options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @param {Number} options.fromIndex - From index (uint32)
   * @param {Number} options.count - Count (uint32)
   * @returns {Promise<Array<String>>} Array of account addresses
   * @throws {ValidationError} If keyVaultAddr is missing or invalid, or if fromIndex/count are invalid
   */
  async getAccountAddresses(options = {}) {
    const { keyVaultAddr, fromIndex, count } = options;
    requireNonNegativeInteger(fromIndex, 'fromIndex');
    requireNonNegativeInteger(count, 'count');

    const keyVault = this.getReadContract(getKeyVaultContract, keyVaultAddr);
    
    return this.executeRead(
      () => keyVault.getAccountAddresses(fromIndex, count),
      'get account addresses',
      options
    );
  }

  /**
   * Sign a raw transaction (authenticated function)
   * 
   * @param {Object} options - Sign transaction options
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - Authentication proof (raw password bytes or wallet signature auth proof)
   * @param {Number|BigInt} options.index - Account index
   * @param {Number|BigInt} options.nonce - Nonce
   * @param {Number|BigInt} options.gasPrice - Gas price
   * @param {Number|BigInt} options.gasLimit - Gas limit
   * @param {String} options.to - To address
   * @param {Number|BigInt} options.value - Value
   * @param {Bytes} options.txData - Transaction data (bytes)
   * @param {Number|BigInt} options.chainId - Chain ID
   * @returns {Promise<String>} Signed transaction
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
      () => keyVault.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId),
      'sign transaction',
      options
    );
  }

  /**
   * Sign an EIP-191 message (authenticated function)
   * 
   * @param {Object} options - Sign message options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {Number|BigInt} options.index - Account index (uint32)
   * @param {Bytes} options.message - Message to sign (bytes)
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
      () => keyVault.signMessage(authProof, index, message),
      'sign message',
      options
    );
  }

  /**
   * Sign a 32-byte hash (authenticated function)
   * 
   * @param {Object} options - Sign hash options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {Number|BigInt} options.index - Account index (uint32)
   * @param {Bytes32} options.hash - Hash to sign (bytes32)
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
      () => keyVault.sign(authProof, index, hash),
      'sign hash',
      options
    );
  }

  /**
   * Execute a function with an auth proof (authenticated function)
   * 
   * @param {Object} options - Execute function options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
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
      () => keyVault.executeWithAuth(authProof, implCall),
      'execute with auth',
      options
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Initialize a KeyVault contract
   * 
   * @param {Object} options - Initialize key vault options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @param {String} options.storageAddr - WalletStorage contract address 
   * @param {String} options.authenticatorAddr - Authenticator contract address
   * @param {Bytes32} options.accessToken - Secret token for storage access (bytes32)
   * @returns {Promise<Object>} Initialize key vault result
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

    return this.executeWrite(
      () => keyVault.initialize(storageAddr, authenticatorAddr, accessToken),
      'initialize key vault',
      options
    );
  }

  /**
   * Upgrade the keyVaultImplementation contract address (authenticated function)
   * 
   * @param {Object} options - Upgrade keyVaultImplementation options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {String} options.newImplAddr - New keyVaultImplementation contract address
   * @returns {Promise<Object>} Upgrade keyVaultImplementation result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async upgradeKeyVaultImplAddr(options = {}) {
    const { keyVaultAddr, authProof, newImplAddr } = options;
    requireBytes(authProof, 'authProof');
    requireAddress(newImplAddr, 'newImplAddr');

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite(
      () => keyVault.upgradeImplementation(authProof, newImplAddr),
      'upgrade key vault implementation',
      {
        ...options,
        parseEvents: [{
          eventDef: KeyVaultEvents.ImplementationUpgraded,
          contract: keyVault
        }]
      }
    );
  }

  /**
   * Change the authenticator (Authenticated function)
   * 
   * @param {Object} options - Change authenticator options
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {String} options.newAuthenticatorAddr - New authenticator contract address
   * @param {Bytes} options.newAuthConfig - New authentication configuration (bytes)
   * @returns {Promise<Object>} Change authenticator result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async changeAuthenticatorAddr(options = {}) {
    const { keyVaultAddr, authProof, newAuthenticatorAddr, newAuthConfig } = options;
    requireBytes(authProof, 'authProof');
    requireAddress(newAuthenticatorAddr, 'newAuthenticatorAddr');
    requireBytes(newAuthConfig, 'newAuthConfig');

    const keyVault = this.getWriteContract(getKeyVaultContract, keyVaultAddr);

    return this.executeWrite(
      () => keyVault.changeAuthenticator(authProof, newAuthenticatorAddr, newAuthConfig),
      'change authenticator',
      {
        ...options,
        parseEvents: [{
          eventDef: KeyVaultEvents.AuthenticatorChanged,
          contract: keyVault
        }]
      }
    );
  }
}

export default KeyVaultClient;
