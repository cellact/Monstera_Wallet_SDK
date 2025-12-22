/**
 * KeyVaultClient
 * 
 * Client for interacting with KeyVault contract methods.
 * Handles key vault operations, signing, and account management.
 */

const BaseContractClient = require('../../internal/BaseContractClient');
const { getKeyVaultContract } = require('../../contracts/core/keyVault');
const { KeyVaultEvents } = require('../../events');

class KeyVaultClient extends BaseContractClient {
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

  // TODO: add initialize method

  /**
   * Get the storage contract address holding the keys
   * 
   * @param {Object} options - Get storage address options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<String>} Storage contract address
   */
  async getStorageAddr(options = {}) {
    const { keyVaultAddress } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');

    const keyVault = this.contract('read', getKeyVaultContract, keyVaultAddress);

    try {
      const storageAddr = await keyVault.storage_();
      return storageAddr;
    } catch (error) {
      throw this.wrapError('get storage address', error, { keyVaultAddress });
    }
  }

  /**
   * Get the authenticator contract address for a wallet 
   * 
   * @param {Object} options - Get authenticator options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<String>} Authenticator address
   */
  async getAuthenticator(options = {}) {
    const { keyVaultAddress } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');

    const keyVault = this.contract('read', getKeyVaultContract, keyVaultAddress);
    try {
      const authenticatorAddr = await keyVault.authenticator();
      return authenticatorAddr;
    }
    catch (error) {
      throw this.wrapError('get authenticator', error, { keyVaultAddress });
    }
  }

  /**
   * Get the current KeyVaultImplementation contract address
   * 
   * @param {Object} options - Get implementation options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<String>} Implementation address
   */
  async getKeyVaultImplAddr(options = {}) {
    const { keyVaultAddress } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');

    const keyVault = this.contract('read', getKeyVaultContract, keyVaultAddress);

    try {
      const keyVaultImplAddr = await keyVault.implementation();
      return keyVaultImplAddr;
    }
    catch (error) {
      throw this.wrapError('get key vault implementation', error, { keyVaultAddress });
    }
  }

  /**
   * Check if a given keyVault is initialized 
   * 
   * @param {Object} options - Check if keyVault is initialized options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<Boolean>} True if keyVault is initialized, false otherwise
   */
  async isInitialized(options = {}) {
    const { keyVaultAddress } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');

    const keyVault = this.contract('read', getKeyVaultContract, keyVaultAddress);
    try {
      const isInitialized = await keyVault.initialized();
      return isInitialized;
    }
    catch (error) {
      throw this.wrapError('check if key vault is initialized', error, { keyVaultAddress });
    }
  }

  /**
   * Upgrade the keyVaultImplementation contract address (authenticated function)
   * 
   * @param {Object} options - Upgrade keyVaultImplementation options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {String} options.newImplAddr - New keyVaultImplementation contract address
   * @returns {Promise<Object>} Upgrade keyVaultImplementation result
   */
  async upgradeKeyVaultImpl(options = {}) {
    const { keyVaultAddress, authProof, newImplAddr } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');
    this.requireBytes(authProof, 'authProof');
    this.requireAddress(newImplAddr, 'newImplAddr');

    const keyVault = this.contract('write', getKeyVaultContract, keyVaultAddress);

    try {
      const result = await this.sendTx(
        () => keyVault.upgradeImplementation(authProof, newImplAddr),
        {
          parseEvents: [{
            eventDef: KeyVaultEvents.ImplementationUpgraded,
            contract: keyVault
          }]
        }
      );

      return result;
    } catch (error) {
      throw this.wrapError('upgrade key vault implementation', error, { keyVaultAddress, newImplAddr });
    }
  }

  /**
   * Change the authenticator (Authenticated function)
   * 
   * @param {Object} options - Change authenticator options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {String} options.newAuthenticatorAddr - New authenticator contract address
   * @param {Bytes} options.newAuthConfig - New authentication configuration (bytes)
   * @returns {Promise<Object>} Change authenticator result
   */
  async changeAuthenticator(options = {}) {
    const { keyVaultAddress, authProof, newAuthenticatorAddr, newAuthConfig } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');
    this.requireBytes(authProof, 'authProof');
    this.requireAddress(newAuthenticatorAddr, 'newAuthenticatorAddr');
    this.requireBytes(newAuthConfig, 'newAuthConfig');

    const keyVault = this.contract('write', getKeyVaultContract, keyVaultAddress);

    try {
      const result = await this.sendTx(
        () => keyVault.changeAuthenticator(authProof, newAuthenticatorAddr, newAuthConfig),
        {
          parseEvents: [{
            eventDef: KeyVaultEvents.AuthenticatorChanged,
            contract: keyVault
          }]
        }
      );

      return result;
    } catch (error) {
      throw this.wrapError('change authenticator', error, { keyVaultAddress });
    }
  }

  /**
   * Get one of a wallet's account addresses for a given index
   * 
   * @param {Object} options - Get account address options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Number} options.index - Account index (uint32)
   * @returns {Promise<String>} Account address
   */
  async getAccountAddress(options = {}) {
    const { keyVaultAddress, index } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');
    this.requireNonNegativeInteger(index, 'index');

    const keyVault = this.contract('read', getKeyVaultContract, keyVaultAddress);

    try {
      const accountAddress = await keyVault.getAccountAddress(index);
      return accountAddress;
    }
    catch (error) {
      throw this.wrapError('get account address', error, { keyVaultAddress, index });
    }
  }

  /**
   * Get multiple account addresses from a wallet for a given range of indexes
   * 
   * @param {Object} options - Get account addresses options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Number} options.fromIndex - From index (uint32)
   * @param {Number} options.count - Count (uint32)
   * @returns {Promise<Array<String>>} Array of account addresses
   */
  async getAccountAddresses(options = {}) {
    const { keyVaultAddress, fromIndex, count } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');
    this.requireNonNegativeInteger(fromIndex, 'fromIndex');
    this.requireNonNegativeInteger(count, 'count');

    const keyVault = this.contract('read', getKeyVaultContract, keyVaultAddress);
    
    try {
      const accountAddresses = await keyVault.getAccountAddresses(fromIndex, count);
      return accountAddresses;
    }
    catch (error) {
      throw this.wrapError('get account addresses', error, { keyVaultAddress, fromIndex, count });
    }
  }

  /**
   * Sign a transaction (authenticated function)
   * 
   * @param {Object} options - Sign transaction options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {Number} options.index - Account index (uint32)
   * @param {Number} options.nonce - Nonce (uint256)
   * @param {Number} options.gasPrice - Gas price (uint256)
   * @param {Number} options.gasLimit - Gas limit (uint256)
   * @param {String} options.to - To address (address)
   * @param {Number} options.value - Value (uint256)
   * @param {Bytes} options.txData - Transaction data (bytes)
   * @param {Number} options.chainId - Chain ID (uint256)
   * @returns {Promise<Bytes>} Signed transaction (bytes)
   */
  async signTransaction(options = {}) {
    const { keyVaultAddress, authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');
    this.requireBytes(authProof, 'authProof');
    this.requireNonNegativeInteger(index, 'index');
    this.requireNonNegativeInteger(nonce, 'nonce');
    this.requireNonNegativeInteger(gasPrice, 'gasPrice');
    this.requireNonNegativeInteger(gasLimit, 'gasLimit');
    this.requireAddress(to, 'to');
    this.requireNonNegativeInteger(value, 'value');
    this.requireBytes(txData, 'txData');
    this.requireNonNegativeInteger(chainId, 'chainId');

    const keyVault = this.contract('write', getKeyVaultContract, keyVaultAddress);

    try {
      const signedTransaction = await keyVault.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId);
      return signedTransaction;
    }
    catch (error) {
      throw this.wrapError('sign transaction', error, { keyVaultAddress, index });
    }
  }

  /**
   * Sign a 32-byte hash (authenticated function)
   * 
   * @param {Object} options - Sign hash options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {Number} options.index - Account index (uint32)
   * @param {Bytes32} options.hash - Hash to sign (bytes32)
   * @returns {Promise<Bytes>} Signed hash (bytes)
   */
  async sign(options = {}) {
    const { keyVaultAddress, authProof, index, hash } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');
    this.requireBytes(authProof, 'authProof');
    this.requireNonNegativeInteger(index, 'index');
    this.requireBytes(hash, 'hash');

    const keyVault = this.contract('write', getKeyVaultContract, keyVaultAddress);

    try {
      const signedHash = await keyVault.sign(authProof, index, hash);
      return signedHash;
    }
    catch (error) {
      throw this.wrapError('sign hash', error, { keyVaultAddress, index });
    }
  }

  /**
   * Sign an EIP-191 message (authenticated function)
   * 
   * @param {Object} options - Sign message options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {Number} options.index - Account index (uint32)
   * @param {Bytes} options.message - Message to sign (bytes)
   * @returns {Promise<Bytes>} Signed message (bytes)
   */
  async signMessage(options = {}) {
    const { keyVaultAddress, authProof, index, message } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');
    this.requireBytes(authProof, 'authProof');
    this.requireNonNegativeInteger(index, 'index');
    this.requireBytes(message, 'message');

    const keyVault = this.contract('write', getKeyVaultContract, keyVaultAddress);

    try {
      const signedMessage = await keyVault.signMessage(authProof, index, message);
      return signedMessage;
    }
    catch (error) {
      throw this.wrapError('sign message', error, { keyVaultAddress, index });
    }
  }

  /**
   * Execute a function with an auth proof (authenticated function)
   * 
   * @param {Object} options - Execute function options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {Bytes} options.implCall - Implementation call (bytes)
   * @returns {Promise<Bytes>} Execute function result (bytes)
   */
  async executeWithAuth(options = {}) {
    const { keyVaultAddress, authProof, implCall } = options;

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');
    this.requireBytes(authProof, 'authProof');
    this.requireBytes(implCall, 'implCall');

    const keyVault = this.contract('write', getKeyVaultContract, keyVaultAddress);

    try {
      const result = await keyVault.executeWithAuth(authProof, implCall);
      return result;
    }
    catch (error) {
      throw this.wrapError('execute with auth', error, { keyVaultAddress });
    }
  }
}

module.exports = KeyVaultClient;

