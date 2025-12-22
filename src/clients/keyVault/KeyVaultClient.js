/**
 * KeyVaultClient
 * 
 * Client for interacting with KeyVault contract methods.
 * Handles key vault operations, signing, and account management.
 */

const { getKeyVaultContract } = require('../../contracts/core/keyVault');
const { parseEventFromReceipt, KeyVaultEvents } = require('../../events');

class KeyVaultClient {
  constructor(readProvider, writeSigner, config) {
    this.readProvider = readProvider;
    this.writeSigner = writeSigner;
    this.config = config;
    this.addresses = config.addresses;
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);

    try {
      const storageAddr = await keyVault.storage_();
      return storageAddr;
    } catch (error) {
      throw new Error(`Failed to get storage address: ${error.message}`);
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);
    try {
      const authenticatorAddr = await keyVault.authenticator();
      return authenticatorAddr;
    }
    catch (error) {
      throw new Error(`Failed to get authenticator address: ${error.message}`);
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);

    try {
      const keyVaultImplAddr = await keyVault.implementation();
      return keyVaultImplAddr;
    }
    catch (error) {
      throw new Error(`Failed to get implementation address: ${error.message}`);
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);
    try {
      const isInitialized = await keyVault.initialized();
      return isInitialized;
    }
    catch (error) {
      throw new Error(`Failed to check if key vault is initialized: ${error.message}`);
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (!authProof) {
      throw new Error('Auth proof is required');
    }
    if (!newImplAddr || typeof newImplAddr !== 'string') {
      throw new Error('New key vault implementation address is required');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const tx = await keyVault.upgradeImplementation(authProof, newImplAddr);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse ImplementationUpgraded event
      const eventData = parseEventFromReceipt(
        KeyVaultEvents.ImplementationUpgraded,
        receipt, 
        keyVault
      );

      if (!eventData) {
        throw new Error('ImplementationUpgraded event not found in transaction receipt');
      }

      const result = {
        success: true,
        oldImpl: eventData.oldImpl,
        newImpl: eventData.newImpl,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to upgrade key vault implementation: ${error.message}`);
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (!authProof) {
      throw new Error('Auth proof is required');
    }

    if (!newAuthenticatorAddr) {
      throw new Error('New authenticator address is required.');
    }

    if (!newAuthConfig) {
      throw new Error('New auth config is required');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const tx = await keyVault.changeAuthenticator(authProof, newAuthenticatorAddr, newAuthConfig);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse AuthenticatorChanged event
      const eventData = parseEventFromReceipt(
        KeyVaultEvents.AuthenticatorChanged,
        receipt, 
        keyVault
      );

      if (!eventData) {
        throw new Error('AuthenticatorChanged event not found in transaction receipt');
      }
      const result = {
        success: true,
        oldAuth: eventData.oldAuth,
        newAuth: eventData.newAuth,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      return result;

    } catch (error) {
      throw new Error(`Failed to change authenticator in key vault: ${error.message}`);
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);

    try {
      const accountAddress = await keyVault.getAccountAddress(index);
      return accountAddress;
    }
    catch (error) {
      throw new Error(`Failed to get account address: ${error.message}`);
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (fromIndex === undefined || fromIndex === null || typeof fromIndex !== 'number' || fromIndex < 0 || !Number.isInteger(fromIndex)) {
      throw new Error('From index is required and must be a non-negative integer');
    }

    if (count === undefined || count === null || typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
      throw new Error('Count is required and must be a non-negative integer');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);
    
    try {
      const accountAddresses = await keyVault.getAccountAddresses(fromIndex, count);
      return accountAddresses;
    }
    catch (error) {
      throw new Error(`Failed to get account addresses: ${error.message}`);
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }
    if (!authProof) {
      throw new Error('Auth proof is required');
    }
  
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }

    if (nonce === undefined || nonce === null || typeof nonce !== 'number' || nonce < 0 || !Number.isInteger(nonce)) {
      throw new Error('Nonce is required and must be a non-negative integer');
    }

    if (!gasPrice) {
      throw new Error('Gas price is required and must be a non-negative integer');
    }

    if (!gasLimit) {
      throw new Error('Gas limit is required and must be a non-negative integer');
    }

    if (!to || typeof to !== 'string') {
      throw new Error('To address is required and must be a string');
    }

    if (value === undefined || value === null || typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
      throw new Error('Value is required and must be a non-negative integer');
    }

    if (!txData) {
      throw new Error('Transaction data is required');
    }

    if (chainId === undefined || chainId === null || typeof chainId !== 'number' || chainId < 0 || !Number.isInteger(chainId)) {
      throw new Error('Chain ID is required and must be a non-negative integer');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const signedTransaction = await keyVault.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId);
      return signedTransaction;
    }
    catch (error) {
      throw new Error(`Failed to sign transaction: ${error.message}`);
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (!authProof) {
      throw new Error('Auth proof is required');
    }
  
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }

    if (!hash) {
      throw new Error('Hash is required');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const signedHash = await keyVault.sign(authProof, index, hash);
      return signedHash;
    }
    catch (error) {
      throw new Error(`Failed to sign hash: ${error.message}`);
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (!authProof) {
      throw new Error('Auth proof is required');
    }
    
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }

    if (!message) {
      throw new Error('Message is required');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const signedMessage = await keyVault.signMessage(authProof, index, message);
      return signedMessage;
    }
    catch (error) {
      throw new Error(`Failed to sign message: ${error.message}`);
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

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }
    if (!authProof) {
      throw new Error('Auth proof is required');
    }
  
    if (!implCall) {
      throw new Error('Implementation call is required');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const result = await keyVault.executeWithAuth(authProof, implCall);
      return result;
    }
    catch (error) {
      throw new Error(`Failed to execute function: ${error.message}`);
    }
  }
}

module.exports = KeyVaultClient;

