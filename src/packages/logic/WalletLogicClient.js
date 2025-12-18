/**
 * WalletLogicClient
 * 
 * Client for interacting with WalletLogic contract methods.
 * Handles wallet operations, signing, and account management.
 */

const { getWalletLogicContract, parse_AuthenticatorChangedEvent } = require('../../contracts/core/walletLogic');
const { parseImplementationUpgradedEvent } = require('../../contracts/core/keyVault');

class WalletLogicClient {
  constructor(readProvider, writeSigner, config) {
    this.readProvider = readProvider;
    this.writeSigner = writeSigner;
    this.config = config;
    this.addresses = config.addresses;
  }

  /**
   * Get the keyVault contract address for a wallet (from wallet logic)
   * 
   * @param {Object} options - KeyVault options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
   */
  async getKeyVault(options = {}) {
    const { walletAddress } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    const logic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const keyVaultAddr = await logic.getKeyVault();
      return keyVaultAddr;
    } catch (error) {
      throw new Error(`Failed to get key vault address: ${error.message}`);
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

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    const logic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const authenticator = await logic.getAuthenticator();
      return authenticator;
    } catch (error) {
      throw new Error(`Failed to get authenticator address: ${error.message}`);
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

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    // index can be 0 or positive integer - check explicitly for undefined/null
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }

    // Get wallet logic contract
    const walletLogic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const accountAddress = await walletLogic.getAccountAddress(index);
      return accountAddress;
    } catch (error) {
      throw new Error(`Failed to get account address: ${error.message}`);
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

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }
    
    if (fromIndex === undefined || fromIndex === null || typeof fromIndex !== 'number' || fromIndex < 0 || !Number.isInteger(fromIndex)) {
      throw new Error('From index is required and must be a non-negative integer');
    }

    if (count === undefined || count === null || typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
      throw new Error('Count is required and must be a non-negative integer');
    }
    
    const walletLogic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const accountAddresses = await walletLogic.getAccountAddresses(fromIndex, count);
      return accountAddresses;
    } catch (error) {
      throw new Error(`Failed to get account addresses: ${error.message}`);
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

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    // TODO: check that authProof is correct type (bytes)
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

    if (!data || typeof data !== 'string') {
      throw new Error('Data is required and must be a string');
    }

    if (chainId === undefined || chainId === null || typeof chainId !== 'number' || chainId < 0 || !Number.isInteger(chainId)) {
      throw new Error('Chain ID is required and must be a non-negative integer');
    }

    const walletLogic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const signature = await walletLogic.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, data, chainId);
      return signature;
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  /**
   * Sign EIP-191 personal message with an account's private key
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

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    // TODO: check that authProof is correct type (bytes)
    if (!authProof) {
      throw new Error('Auth proof is required');
    }
    
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }
    
    if (!message) {
      throw new Error('Message is required');
    }

    const walletLogic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const signature = await walletLogic.signMessage(authProof, index, message);
      return signature;
    } catch (error) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  /**
   * Sign a 32-byte hash with an account's private key
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

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    // TODO: check that authProof is correct type (bytes)
    if (!authProof) {
      throw new Error('Auth proof is required');
    }
    
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }
    
    if (!hash) {
      throw new Error('Hash is required');
    }

    const walletLogic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const signature = await walletLogic.sign(authProof, index, hash);
      return signature;
    } catch (error) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  /**
   * Change the authenticator (User-only) (via walletLogic contract)
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

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    // TODO: check that authProof is correct type (bytes)
    if (!authProof) {
      throw new Error('Auth proof is required');
    }

    if (!newAuthenticatorAddress || typeof newAuthenticatorAddress !== 'string') {
      throw new Error('New authenticator address is required');
    }

    if (!newAuthConfig) {
      throw new Error('New auth config is required');
    }

    const walletLogic = getWalletLogicContract(this.writeSigner, walletAddress);

    try {
      const tx = await walletLogic.changeAuthenticator(authProof, newAuthenticatorAddress, newAuthConfig);

      // Wait for transaction
      const receipt = await tx.wait();

      console.log("   Transaction receipt:", receipt);

      // Parse AuthenticatorChanged event
      const eventData = parse_AuthenticatorChangedEvent(receipt, walletLogic);
      
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
      throw new Error(`Failed to change authenticator: ${error.message}`);
    }
  }

  /**
   * Upgrade the keyVaultImplementation (via walletLogic contract) (User-only)
   * 
   * @param {Object} options - Upgrade keyVault implementation options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {String} options.newImplAddr - New keyVault contract address
   * @returns {Promise<Object>} Upgrade keyVault result
   */
  async upgradeKeyVault(options = {}) {
    const { walletAddress, authProof, newImplAddr } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    if (!authProof) {
      throw new Error('Auth proof is required');
    }

    if (!newImplAddr || typeof newImplAddr !== 'string') {
      throw new Error('New key vault address is required');
    }

    const walletLogic = getWalletLogicContract(this.writeSigner, walletAddress);

    try {
      const tx = await walletLogic.upgradeKeyVault(authProof, newImplAddr);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse ImplementationUpgraded event
      const eventData = parseImplementationUpgradedEvent(receipt, walletLogic);
      
      if (!eventData) {
        throw new Error('ImplementationUpgraded event not found in transaction receipt');
      }

      const result = {
        success: true,
        oldImpl: eventData.oldImpl,
        newImplAddr: eventData.newImplementation,
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
   * Get the keyVault contract address for a wallet (from wallet logic)
   * 
   * @param {Object} options - KeyVault options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
   */
  async getKeyvaultAddr(options = {}) {
    const { walletAddress } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    const walletLogic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const keyVaultAddr = await walletLogic.keyVault();
      return keyVaultAddr;
    } catch (error) {
      throw new Error(`Failed to get key vault address: ${error.message}`);
    }
  }

  /**
   * Check if a wallet is initialized (via walletLogic contract)
   * 
   * @param {Object} options - Is initialized options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<Boolean>} True if wallet is initialized, false otherwise
   */
  async isInitialized(options = {}) {
    const { walletAddress } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    const walletLogic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const isInitialized = await walletLogic.initialized();
      return isInitialized;
    } catch (error) {
      throw new Error(`Failed to check if wallet is initialized: ${error.message}`);
    }
  }

  /**
   * Initialize a wallet logic with a new keyVault (via walletLogic contract)
   * 
   * @param {Object} options - Initialize wallet logic options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<Object>} Initialize wallet logic result
   */
  async initializeWalletLogic(options = {}) {
    const { walletAddress, keyVaultAddress } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('Key vault address is required');
    }

    const walletLogic = getWalletLogicContract(this.writeSigner, walletAddress);
  
    try {
      const tx = await walletLogic.initialize(keyVaultAddress);

      // Wait for transaction
      const receipt = await tx.wait();

      return receipt;
    } catch (error) {
      throw new Error(`Failed to initialize wallet logic: ${error.message}`);
    }
  }
}

module.exports = WalletLogicClient;

