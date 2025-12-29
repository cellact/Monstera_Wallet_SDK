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

    requireAddress(walletAddress, 'walletAddress');

    const logic = this.getReadContract(getWalletLogicContract, walletAddress);

    try {
      const keyVaultAddr = await logic.getKeyVault();
      return keyVaultAddr;
    } catch (error) {
      throw this.wrapError('get key vault', error, { walletAddress });
    }
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

    requireAddress(walletAddress, 'walletAddress');

    const logic = this.getReadContract(getWalletLogicContract, walletAddress);

    try {
      const authenticator = await logic.getAuthenticator();
      return authenticator;
    } catch (error) {
      throw this.wrapError('get authenticator', error, { walletAddress });
    }
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

    requireAddress(walletAddress, 'walletAddress');
    requireNonNegativeInteger(index, 'index');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    try {
      const accountAddress = await walletLogic.getAccountAddress(index);
      return accountAddress;
    } catch (error) {
      throw this.wrapError('get account address', error, { walletAddress, index });
    }
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

    requireAddress(walletAddress, 'walletAddress');
    requireNonNegativeInteger(fromIndex, 'fromIndex');
    requireNonNegativeInteger(count, 'count');
    
    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    try {
      const accountAddresses = await walletLogic.getAccountAddresses(fromIndex, count);
      return accountAddresses;
    } catch (error) {
      throw this.wrapError('get account addresses', error, { walletAddress, fromIndex, count });
    }
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

    requireAddress(walletAddress, 'walletAddress');
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

    try {
      const signature = await walletLogic.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, data, chainId);
      return signature;
    } catch (error) {
      throw this.wrapError('sign transaction', error, { walletAddress, index });
    }
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

    requireAddress(walletAddress, 'walletAddress');
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(message, 'message');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    try {
      const signature = await walletLogic.signMessage(authProof, index, message);
      return signature;
    } catch (error) {
      throw this.wrapError('sign message', error, { walletAddress, index });
    }
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

    requireAddress(walletAddress, 'walletAddress');
    requireBytes(authProof, 'authProof');
    requireNonNegativeInteger(index, 'index');
    requireBytes(hash, 'hash');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    try {
      const signature = await walletLogic.sign(authProof, index, hash);
      return signature;
    } catch (error) {
      throw this.wrapError('sign hash', error, { walletAddress, index });
    }
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

    requireAddress(walletAddress, 'walletAddress');
    requireBytes(authProof, 'authProof');
    requireAddress(newAuthenticatorAddress, 'newAuthenticatorAddress');
    requireBytes(newAuthConfig, 'newAuthConfig');

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddress);

    try {
      const result = await this.sendTx(
        () => walletLogic.changeAuthenticator(authProof, newAuthenticatorAddress, newAuthConfig),
        {
          parseEvents: [{
            eventDef: KeyVaultEvents.AuthenticatorChanged, // Is actually a KeyVault contract event
            contract: walletLogic
          }]
        }
      );

      return result;
    } catch (error) {
      throw this.wrapError('change authenticator', error, { walletAddress });
    }
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

    requireAddress(walletAddress, 'walletAddress');
    requireBytes(authProof, 'authProof');
    requireAddress(newImplAddr, 'newImplAddr');

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddress);

    try {
      const result = await this.sendTx(
        () => walletLogic.upgradeKeyVault(authProof, newImplAddr),
        {
          parseEvents: [{
            eventDef: KeyVaultEvents.ImplementationUpgraded, // Is actually a KeyVault contract event
            contract: walletLogic
          }],
          extraData: { newImplAddr: newImplAddr }
        }
      );

      return result;
    } catch (error) {
      throw this.wrapError('upgrade key vault implementation', error, { walletAddress, newImplAddr });
    }
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

    requireAddress(walletAddress, 'walletAddress');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    try {
      const keyVaultAddr = await walletLogic.keyVault();
      return keyVaultAddr;
    } catch (error) {
      throw this.wrapError('get key vault address', error, { walletAddress });
    }
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

    requireAddress(walletAddress, 'walletAddress');

    const walletLogic = this.getReadContract(getWalletLogicContract, walletAddress);

    try {
      const isInitialized = await walletLogic.initialized();
      return isInitialized;
    } catch (error) {
      throw this.wrapError('check if wallet is initialized', error, { walletAddress });
    }
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

    requireAddress(walletAddress, 'walletAddress');
    requireAddress(keyVaultAddress, 'keyVaultAddress');

    const walletLogic = this.getWriteContract(getWalletLogicContract, walletAddress);
  
    try {
      const result = await this.sendTx(
        () => walletLogic.initialize(keyVaultAddress),
        {
          parseEvents: []
        }
      );

      return result;
    } catch (error) {
      throw this.wrapError('initialize wallet logic', error, { walletAddress, keyVaultAddress });
    }
  }
}

module.exports = WalletLogicClient;

