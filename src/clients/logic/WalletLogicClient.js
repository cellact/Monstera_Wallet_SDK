/**
 * WalletLogicClient
 * 
 * Client for interacting with WalletLogic contract methods.
 * Handles wallet operations, signing, and account management.
 */

// Internal base classes
const BaseContractClient = require('../../base/BaseContractClient');

// Internal contracts
const { getWalletLogicContract } = require('../../contracts/core/walletLogic');

// Internal events
const { KeyVaultEvents } = require('../../events');

// Internal utilities
const { requireAddress, requireBytes, requireNonNegativeInteger, requireString } = require('../../internal/assert');

class WalletLogicClient extends BaseContractClient {
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
   * Get the keyVault contract address for a wallet 
   * 
   * @param {Object} options - KeyVault options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
   * @throws {ValidationError} If walletAddress is missing or invalid
   */
  async getKeyVault(options = {}) {
    const { walletAddress } = options;
    const logic = this.getReadContract(getWalletLogicContract, walletAddress);

    return this.executeRead(
      () => logic.getKeyVault(),
      'get key vault',
      options
    );
  }

  /**
   * Get the keyVault contract address for a wallet
   * 
   * @param {Object} options - KeyVault options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
   * @throws {ValidationError} If walletAddress is missing or invalid
   */
  async getKeyvaultAddr(options = {}) {
    const { walletAddress } = options;
    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    return this.executeRead(
      () => walletLogic.keyVault(),
      'get key vault address',
      options
    );
  }

  /**
   * Get the current authenticator address for a wallet
   * 
   * @param {Object} options - Authenticator options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} Authenticator address (from KeyVault)
   * @throws {ValidationError} If walletAddress is missing or invalid
   */
  async getAuthenticator(options = {}) {
    const { walletAddress } = options;
    const logic = this.getReadContract(getWalletLogicContract, walletAddress);

    return this.executeRead(
      () => logic.getAuthenticator(),
      'get authenticator',
      options
    );
  }

  /**
   * Check if a wallet is initialized
   * 
   * @param {Object} options - Is initialized options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<Boolean>} True if wallet is initialized, false otherwise
   * @throws {ValidationError} If walletAddress is missing or invalid
   */
  async isInitialized(options = {}) {
    const { walletAddress } = options;
    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    return this.executeRead(
      () => walletLogic.initialized(),
      'check if wallet is initialized',
      options
    );
  }

  /**
   * Get account address at an index from wallet
   * 
   * @param {Object} options - Account address options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Number} options.index - Account index (uint32)
   * @returns {Promise<String>} Account address
   * @throws {ValidationError} If walletAddress is missing or invalid, or if index is invalid
   */
  async getAccountAddress(options = {}) {
    const { walletAddress, index } = options;
    requireNonNegativeInteger(index, 'index');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    return this.executeRead(
      () => walletLogic.getAccountAddress(index),
      'get account address',
      options
    );
  }

  /**
   * Get account addresses from wallet
   * 
   * @param {Object} options - Account addresses options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Number} options.fromIndex - From index (uint32)
   * @param {Number} options.count - Count (uint32)
   * @returns {Promise<Array<String>>} Array of account addresses
   * @throws {ValidationError} If walletAddress is missing or invalid, or if fromIndex/count are invalid
   */
  async getAccountAddresses(options = {}) {
    const { walletAddress, fromIndex, count } = options;
    requireNonNegativeInteger(fromIndex, 'fromIndex');
    requireNonNegativeInteger(count, 'count');
    
    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    return this.executeRead(
      () => walletLogic.getAccountAddresses(fromIndex, count),
      'get account addresses',
      options
    );
  }

  /**
   * Sign a raw transaction with an account's private key (authenticated function)
   * 
   * @param {Object} options - Sign transaction options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - Authentication proof (raw password bytes or wallet signature auth proof)
   * @param {Number} options.index - Account index
   * @param {Number} options.nonce - Nonce
   * @param {Number} options.gasPrice - Gas price
   * @param {Number} options.gasLimit - Gas limit
   * @param {String} options.to - To address
   * @param {Number} options.value - Value
   * @param {String} options.data - Data (hex string) // TODO: check if data should be string or bytes 
   * @param {Number} options.chainId - Chain ID
   * @returns {Promise<String>} Signed transaction
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signTransaction(options = {}) {
    const { walletAddress, authProof, index, nonce, gasPrice, gasLimit, to, value, data, chainId } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireNonNegativeInteger(nonce, 'nonce');
    requireNonNegativeInteger(gasPrice, 'gasPrice');
    requireNonNegativeInteger(gasLimit, 'gasLimit');
    requireAddress(to, 'to');
    requireNonNegativeInteger(value, 'value');
    requireString(data, 'data');
    requireNonNegativeInteger(chainId, 'chainId');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    return this.executeRead(
      () => walletLogic.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, data, chainId),
      'sign transaction',
      options
    );
  }

  /**
   * Sign EIP-191 personal message with an account's private key (authenticated function)
   * 
   * @param {Object} options - Sign message options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - Authentication proof (raw password bytes or wallet signature auth proof)
   * @param {Number} options.index - Account index
   * @param {Bytes} options.message - Message to sign (utf8 encoded string)
   * @returns {Promise<String>} Signed message
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signMessage(options = {}) {
    const { walletAddress, authProof, index, message } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(message, 'message');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    return this.executeRead(
      () => walletLogic.signMessage(authProof, index, message),
      'sign message',
      options
    );
  }

  /**
   * Sign a 32-byte hash with an account's private key (authenticated function)
   * 
   * @param {Object} options - Sign hash options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - Authentication proof (raw password bytes or wallet signature auth proof)
   * @param {Number} options.index - Account index
   * @param {Bytes32} options.hash - Hash to sign (32 bytes)
   * @returns {Promise<String>} Signed hash
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async sign(options = {}) {
    const { walletAddress, authProof, index, hash } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(hash, 'hash');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    return this.executeRead(
      () => walletLogic.sign(authProof, index, hash),
      'sign hash',
      options
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Change the authenticator (authenticated function)
   * 
   * @param {Object} options - Change authenticator options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - Authentication proof (raw password bytes or wallet signature auth proof)
   * @param {String} options.newAuthenticatorAddress - New authenticator contract address
   * @param {Bytes} options.newAuthConfig - New authentication configuration (bytes)
   * @returns {Promise<Object>} Change authenticator result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async changeAuthenticator(options = {}) {
    const { walletAddress, authProof, newAuthenticatorAddress, newAuthConfig } = options;
    requireBytes(authProof, 'authProof');
    requireAddress(newAuthenticatorAddress, 'newAuthenticatorAddress');
    requireBytes(newAuthConfig, 'newAuthConfig');

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddress);

    return this.executeWrite(
      () => walletLogic.changeAuthenticator(authProof, newAuthenticatorAddress, newAuthConfig),
      'change authenticator',
      {
        ...options,
        parseEvents: [{
          eventDef: KeyVaultEvents.AuthenticatorChanged, // Is actually a KeyVault contract event
          contract: walletLogic
        }]
      }
    );
  }

  /**
   * Upgrade the keyVaultImplementation (authenticated function)
   * 
   * @param {Object} options - Upgrade keyVault implementation options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - Authentication proof (raw password bytes or wallet signature auth proof)
   * @param {String} options.newImplAddr - New keyVault contract address
   * @returns {Promise<Object>} Upgrade keyVaultImplementation result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async upgradeKeyVaultImpl(options = {}) {
    const { walletAddress, authProof, newImplAddr } = options;
    requireBytes(authProof, 'authProof');
    requireAddress(newImplAddr, 'newImplAddr');

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddress);

    return this.executeWrite(
      () => walletLogic.upgradeKeyVault(authProof, newImplAddr),
      'upgrade key vault implementation',
      {
        ...options,
        parseEvents: [{
          eventDef: KeyVaultEvents.ImplementationUpgraded, // Is actually a KeyVault contract event
          contract: walletLogic
        }],
        extraData: { newImplAddr: newImplAddr }
      }
    );
  }

  /**
   * Initialize a wallet logic with a new keyVault 
   * 
   * @param {Object} options - Initialize wallet logic options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<Object>} Initialize wallet logic result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async initialize(options = {}) {
    const { walletAddress, keyVaultAddress } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddress);
  
    return this.executeWrite(
      () => walletLogic.initialize(keyVaultAddress),
      'initialize wallet logic',
      options
    );
  }
}

module.exports = WalletLogicClient;
