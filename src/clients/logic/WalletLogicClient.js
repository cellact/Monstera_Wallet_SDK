/**
 * WalletLogicClient
 * 
 * Client for interacting with WalletLogic contract methods.
 * Handles wallet operations, signing, and account management.
 */

// Internal base classes
import BaseContractClient from '../../base/BaseContractClient.js';

// Internal contracts
import { getWalletLogicContract } from '../../contracts/core/walletLogic.js';

// Internal events
import { KeyVaultEvents } from '../../events/index.js';

// Internal utilities
import { requireAddress, requireBytes, requireNonNegativeInteger } from '../../internal/assert.js';

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
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getKeyVaultAddr(options = {}) {
    const { walletAddr } = options;
    const logic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      () => logic.getKeyVault(),
      'get key vault address',
      options
    );
  }

  /**
   * Get the keyVault contract address for a wallet
   * 
   * @param {Object} options - KeyVault options
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async get_key_vault_addr(options = {}) {
    const { walletAddr } = options;
    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      () => walletLogic.keyVault(),
      'get key vault address',
      options
    );
  }

  /**
   * Get the current authenticator contract address for a wallet
   * 
   * @param {Object} options - Get authenticator options
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} Authenticator address 
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getAuthenticatorAddr(options = {}) {
    const { walletAddr } = options;
    const logic = this.getReadContract(getWalletLogicContract, walletAddr);

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
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @returns {Promise<Boolean>} True if wallet is initialized, false otherwise
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async isInitialized(options = {}) {
    const { walletAddr } = options;
    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

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
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @param {Number} options.index - Account index (uint32)
   * @returns {Promise<String>} Account address
   * @throws {ValidationError} If walletAddr is missing or invalid, or if index is invalid
   */
  async getAccountAddr(options = {}) {
    const { walletAddr, index } = options;
    requireNonNegativeInteger(index, 'index');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

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
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @param {Number} options.fromIndex - From index (uint32)
   * @param {Number} options.count - Count (uint32)
   * @returns {Promise<Array<String>>} Array of account addresses
   * @throws {ValidationError} If walletAddr is missing or invalid, or if fromIndex/count are invalid
   */
  async getAccountAddresses(options = {}) {
    const { walletAddr, fromIndex, count } = options;
    requireNonNegativeInteger(fromIndex, 'fromIndex');
    requireNonNegativeInteger(count, 'count');
    
    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      () => walletLogic.getAccountAddresses(fromIndex, count),
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
   * @param {Bytes} options.data - Transaction Data (bytes)
   * @param {Number|BigInt} options.chainId - Chain ID
   * @returns {Promise<String>} Signed transaction
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signTransaction(options = {}) {
    const { walletAddr, authProof, index, nonce, gasPrice, gasLimit, to, value, data, chainId } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireNonNegativeInteger(nonce, 'nonce');
    requireNonNegativeInteger(gasPrice, 'gasPrice');
    requireNonNegativeInteger(gasLimit, 'gasLimit');
    requireAddress(to, 'to');
    requireNonNegativeInteger(value, 'value');
    requireBytes(data, 'data');
    requireNonNegativeInteger(chainId, 'chainId');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      () => walletLogic.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, data, chainId),
      'sign transaction',
      options
    );
  }

  /**
   * Sign an EIP-191 message (authenticated function)
   * 
   * @param {Object} options - Sign message options
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - Authentication proof (raw password bytes or wallet signature auth proof)
   * @param {Number|BigInt} options.index - Account index
   * @param {Bytes} options.message - Message to sign (utf8 encoded string)
   * @returns {Promise<String>} Signed message
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signMessage(options = {}) {
    const { walletAddr, authProof, index, message } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(message, 'message');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

    return this.executeRead(
      () => walletLogic.signMessage(authProof, index, message),
      'sign message',
      options
    );
  }

  /**
   * Sign a 32-byte hash (authenticated function)
   * 
   * @param {Object} options - Sign hash options
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - Authentication proof (raw password bytes or wallet signature auth proof)
   * @param {Number|BigInt} options.index - Account index
   * @param {Bytes32} options.hash - Hash to sign (32 bytes)
   * @returns {Promise<String>} Signed hash
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async sign(options = {}) {
    const { walletAddr, authProof, index, hash } = options;
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(hash, 'hash');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddr);

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
   * Initialize a wallet logic with a new keyVault 
   * 
   * @param {Object} options - Initialize wallet logic options
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Object>} Initialize wallet logic result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async initialize(options = {}) {
    const { walletAddr, keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddr);
  
    return this.executeWrite(
      () => walletLogic.initialize(keyVaultAddr),
      'initialize wallet logic',
      options
    );
  }

  /**
   * Change the authenticator (authenticated function)
   * 
   * @param {Object} options - Change authenticator options
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - Authentication proof (raw password bytes or wallet signature auth proof)
   * @param {String} options.newAuthenticatorAddr - New authenticator contract address
   * @param {Bytes} options.newAuthConfig - New authentication configuration (bytes)
   * @returns {Promise<Object>} Change authenticator result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async changeAuthenticatorAddr(options = {}) {
    const { walletAddr, authProof, newAuthenticatorAddr, newAuthConfig } = options;
    requireBytes(authProof, 'authProof');
    requireAddress(newAuthenticatorAddr, 'newAuthenticatorAddr');
    requireBytes(newAuthConfig, 'newAuthConfig');

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddr);

    return this.executeWrite(
      () => walletLogic.changeAuthenticator(authProof, newAuthenticatorAddr, newAuthConfig),
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
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - Authentication proof (raw password bytes or wallet signature auth proof)
   * @param {String} options.newImplAddr - New keyVault contract address
   * @returns {Promise<Object>} Upgrade keyVaultImplementation result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async upgradeKeyVaultImplAddr(options = {}) {
    const { walletAddr, authProof, newImplAddr } = options;
    requireBytes(authProof, 'authProof');
    requireAddress(newImplAddr, 'newImplAddr');

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddr);

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
}

export default WalletLogicClient;
