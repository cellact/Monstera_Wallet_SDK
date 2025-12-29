/**
 * WalletLogicClient
 * 
 * Client for interacting with WalletLogic contract methods.
 * Handles wallet operations, signing, and account management.
 */

const BaseContractClient = require('../../base/BaseContractClient');
const { getWalletLogicContract } = require('../../contracts/core/walletLogic');
const { KeyVaultEvents } = require('../../events');
const { requireAddress, requireBytes, requireNonNegativeInteger, requireString } = require('../../internal/assert');

class WalletLogicClient extends BaseContractClient {
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

  /**
   * Get the keyVault contract address for a wallet 
   * 
   * @param {Object} options - KeyVault options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
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
   * Get the current authenticator address for a wallet
   * 
   * @param {Object} options - Authenticator options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} Authenticator address (from KeyVault)
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
   * Get account address at an index from wallet
   * 
   * @param {Object} options - Account address options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Number} options.index - Account index (uint32)
   * @returns {Promise<String>} Account address
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
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {Number} options.index - Account index
   * @param {Number} options.nonce - Nonce
   * @param {Number} options.gasPrice - Gas price
   * @param {Number} options.gasLimit - Gas limit
   * @param {String} options.to - To address
   * @param {Number} options.value - Value
   * @param {Bytes} options.data - Data
   * @param {Number} options.chainId - Chain ID
   * @param {Object} options.transaction - Transaction to sign
   * @returns {Promise<String>} Signed transaction
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
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {Number} options.index - Account index
   * @param {Bytes} options.message - Message to sign (utf8 encoded string)
   * @returns {Promise<String>} Signed message
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
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {Number} options.index - Account index
   * @param {Bytes32} options.hash - Hash to sign
   * @returns {Promise<String>} Signed message
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

  /**
   * Change the authenticator (authenticated function)
   * 
   * @param {Object} options - Change authenticator options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {String} options.newAuthenticatorAddress - New authenticator contract address
   * @param {Bytes} options.newAuthConfig - New authentication configuration (bytes)
   * @returns {Promise<Object>} Change authenticator result
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
   * @param {String} options.newImplAddr - New keyVault contract address
   * @returns {Promise<Object>} Upgrade keyVaultImplementation result
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
   * Get the keyVault contract address for a wallet
   * 
   * @param {Object} options - KeyVault options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
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
   * Check if a wallet is initialized
   * 
   * @param {Object} options - Is initialized options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<Boolean>} True if wallet is initialized, false otherwise
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
   * Initialize a wallet logic with a new keyVault 
   * 
   * @param {Object} options - Initialize wallet logic options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<Object>} Initialize wallet logic result
   */
  async initialize(options = {}) {
    const { walletAddress, keyVaultAddress } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddress);
  
    return this.executeWrite(
      () => walletLogic.initialize(keyVaultAddress),
      'initialize wallet logic',
      {
        ...options,
        parseEvents: []
      }
    );
  }
}

module.exports = WalletLogicClient;
