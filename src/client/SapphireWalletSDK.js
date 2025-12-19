/**
 * Monstera Wallet SDK
 * 
 * Main SDK class for interacting with Monstera wallet contracts.
 * Provides clean API for read and write operations.
 */

const { createSdkConfig } = require('../config/networks');
const { getReadProvider, getWriteSigner } = require('../provider/sapphire');
const { createAuthProof } = require('../crypto/wallet');
const { getWalletSignatureAuthenticatorContract, parseAddressAddedEvent, parseAddressRemovedEvent } = require('../contracts/authenticators/WalletSignatureAuthenticator');
const { Wallet, HDNodeWallet } = require('ethers');
// KeyVault methods moved to KeyVaultClient
const { getPasswordAuthenticatorContract, parsePasswordChangedEvent } = require('../contracts/authenticators/PasswordAuthenticator');
const WalletFactoryClient = require('../packages/factory');
const WalletLogicClient = require('../packages/logic');
const KeyVaultClient = require('../packages/keyVault');
const { getWalletFactoryContract } = require('../contracts/core/walletFactory');

/**
 * Monstera Wallet SDK
 * 
 * Main entry point for wallet operations on Oasis Sapphire.
 * 
 */
class Monstera {
  constructor(config) {
    this.config = config;
    this.network = config.network;
    this.chainId = config.chainId;
    this.rpcUrl = config.rpcUrl;
    this.addresses = config.addresses;
    this.signerOrProvider = config.signerOrProvider;
    
    // Initialize read provider (for read operations)
    this.readProvider = getReadProvider(this.rpcUrl);
    
    // Initialize write signer (for write operations with Sapphire wrapper)
    this.writeSigner = getWriteSigner(this.signerOrProvider, this.rpcUrl);

    // Wire domain clients
    this.factory = new WalletFactoryClient(this.readProvider, this.writeSigner, config);

    // Initialize logic client
    this.logic = new WalletLogicClient(this.readProvider, this.writeSigner, config);

    // Initialize key vault client
    this.keyVault = new KeyVaultClient(this.readProvider, this.writeSigner, config);

    // Namespace for wallet operations
    this.wallets = {
      // SDK function - no contract call 
      createAuthProof: this.createAuthProof.bind(this),

      // WalletSignatureAuthenticator functions
      // verify: this.verify.bind(this),
      // configure: this.configure.bind(this),
      addToWhitelist: this.addToWhitelist.bind(this),
      removeFromWhitelist: this.removeFromWhitelist.bind(this),
      isConfiguredWalletSigAuth: this.isConfiguredWalletSigAuth.bind(this), // isConfigured in WalletSignatureAuthenticator contract
      isWhitelisted: this.isWhitelisted.bind(this),
      getWhitelist: this.getWhitelist.bind(this),
      getDomainSeparator: this.getDomainSeparator.bind(this),

      // PasswordAuthenticator functions
      // verify: this.verify.bind(this),
      // configure: this.configure.bind(this),
      changePassword: this.changePassword.bind(this),
      isConfigured: this.isConfigured.bind(this),
    };
  }

  /**
   * Create SDK instance from configuration
   * 
   * @param {Object} options - SDK configuration
   * @param {'testnet'|'mainnet'} options.network - Network to use
   * @param {String} [options.rpcUrl] - Custom RPC URL (optional)
   * @param {Object} [options.addresses] - Contract addresses
   * @param {String|Object} options.signerOrProvider - Signer or provider
   * @returns {Monstera} SDK instance
   */
  static fromConfig(options) {
    const config = createSdkConfig(options);
    return new Monstera(config);
  }

  /**
   * Get the keyVault contract address for a wallet (from wallet factory)
   * 
   * @param {Object} options - KeyVault options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
   */
  async getWalletKeyVault(options = {}) {
    const { walletAddress } = options;
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

    try {
      const keyVaultAddr = await factory.walletKeyVault(walletAddress);
      return keyVaultAddr;
    } catch (error) {
      throw new Error(`Failed to get wallet key vault address: ${error.message}`);
    }
  }

  // /**
  //  * Get the storage contract address for a wallet (from wallet factory)
  //  * 
  //  * @param {Object} options - Storage options
  //  * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
  //  * @returns {Promise<String>} Storage contract address
  //  */
  // async getWalletStorage(options = {}) {
  //   const { walletAddress } = options;
  //   if (!walletAddress || typeof walletAddress !== 'string') {
  //     throw new Error('Wallet address is required');
  //   }

  //   const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

  //   try {
  //     const storageAddr = await factory.walletStorage(walletAddress);
  //     return storageAddr;
  //   } catch (error) {
  //     throw new Error(`Failed to get wallet storage address: ${error.message}`);
  //   }
  // }

  // /**
  //  * Get the beacon address for a wallet (from wallet factory)
  //  * 
  //  * The beacon controlling WalletLogic upgrades
  //  * 
  //  * @returns {Promise<String>} Beacon address
  //  */
  // async getBeaconAddr() {

  //   const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

  //   try {
  //     const beaconAddr = await factory.beacon();
  //     return beaconAddr;
  //   } catch (error) {
  //     throw new Error(`Failed to get beacon address: ${error.message}`);
  //   }
  // }

  async getDefaultKeyVaultImplAddr() {
    const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

    try {
      const defaultKeyVaultImpl = await factory.getDefaultKeyVaultImpl();
      return defaultKeyVaultImpl;
    } catch (error) {
      throw new Error(`Failed to get default key vault implementation: ${error.message}`);
    }
  }

  /**
   * Create an auth proof for a wallet
   * 
   * @param {Object} options - Create auth proof options
   * @param {String} options.authenticateFor - Wallet address to authenticate for
   * @param {Object} options.signer - Signer (Wallet or HDNodeWallet) trying to authenticate
   * @param {String} options.keyVault - KeyVault address of the wallet trying to authenticate
   * @param {String} options.authenticator - Wallet signature authenticator contract address (optional, defaults to the one in the config)
   * @param {Number} options.deadline - Deadline for the auth proof (optional, defaults to 1h from now)
   * @param {String} options.chainId - Chain ID (optional, defaults to the one in the config)
   * @returns {Promise<String>} Auth proof (bytes)
   */
  async createAuthProof(options = {}) {
    const { authenticateFor, signer, keyVault } = options;
    let { authenticator, deadline, chainId } = options;

    if (!authenticateFor || typeof authenticateFor !== 'string') {
      throw new Error('Authenticate for is required and must be a string');
    }

    if (!signer || !(signer instanceof Wallet || signer instanceof HDNodeWallet)) {
      throw new Error('Signer must be a Wallet or HDNodeWallet');
    }

    if (!keyVault || typeof keyVault !== 'string') {
      throw new Error('Key vault is required and must be a string');
    }

    // if no authenticator contract address provided use default from config
    if (!authenticator || typeof authenticator !== 'string') {
      authenticator = this.addresses.walletSignatureAuth;
    }

    // if deadline is provided, check if it is a number and in the future
    if (deadline && (typeof deadline !== 'number' || deadline < Date.now())) {
      throw new Error('Deadline must be a number and in the future');
    } else if (!deadline) {
      // if no deadline provided, default to 1 hour from now
      deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    }

    if (chainId && (typeof chainId !== 'string')) {
      throw new Error('Chain ID must be a string');
    } else if (!chainId) {
      // if no chainId provided, default to the one in the config
      chainId = this.chainId;
    }

    const authProof = await createAuthProof(signer, chainId, authenticator, deadline, keyVault);

    return authProof;
  }

  /**
   * Add a new address to the whitelist
   * 
   * @param {Object} options - Add to whitelist options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {String} options.newAddress - New address to add to the whitelist
   * @returns {Promise<Object>} Transaction receipt
   */
  async addToWhitelist(options = {}) {
    const { keyVaultAddress, authProof, newAddress } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    // TODO: check that authProof is correct type (bytes)
    if (!authProof) {
      throw new Error('Auth proof is required');
    }

    if (!newAddress || typeof newAddress !== 'string') {
      throw new Error('New address is required');
    }

    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.writeSigner, this.addresses.walletSignatureAuth);

    try {
      const tx = await walletSigAuth.addToWhitelist(keyVaultAddress, authProof, newAddress);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse AddressAdded event
      const eventData = parseAddressAddedEvent(receipt, walletSigAuth);
      
      if (!eventData) {
        throw new Error('AddressAdded event not found in transaction receipt');
      }

      const result = {
        success: true,
        wallet: eventData.wallet,
        added: eventData.added,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      return result;
    } catch (error) {
      throw new Error(`Failed to add to whitelist: ${error.message}`);
    }
  }

  /**
   * Remove an address from the whitelist
   * 
   * @param {Object} options - Remove from whitelist options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {String} options.addressToRemove - Address to remove from the whitelist
   * @returns {Promise<Object>} Transaction receipt
   */
  async removeFromWhitelist(options = {}) {
    const { keyVaultAddress, authProof, addressToRemove } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('Wallet address is required');
    }
  
    if (!authProof) {
      throw new Error('Auth proof is required');
    }

    if (!addressToRemove || typeof addressToRemove !== 'string') {
      throw new Error('Address is required');
    }

    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.writeSigner, this.addresses.walletSignatureAuth);

    try {
      const tx = await walletSigAuth.removeFromWhitelist(keyVaultAddress, authProof, addressToRemove);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse AddressRemoved event
      const eventData = parseAddressRemovedEvent(receipt, walletSigAuth);
      
      if (!eventData) {
        throw new Error('WhitelistRemoved event not found in transaction receipt');
      }

      const result = {
        success: true,
        wallet: eventData.wallet,
        removed: eventData.removed,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      return result;
    } catch (error) {
      throw new Error(`Failed to remove from whitelist: ${error.message}`);
    }
  }

  /**
   * Check if a wallet is configured (via walletSignatureAuthenticator contract)
   * 
   * @param {Object} options - Is configured options
   * @param {String} options.keyVaultAddress - KeyVault address of the wallet
   * @returns {Promise<Boolean>} True if wallet is configured, false otherwise
   */
  async isConfiguredWalletSigAuth(options = {}) {
    const { keyVaultAddress } = options;
    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error(' address is required');
    }

    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.readProvider, this.addresses.walletSignatureAuth);
    try {
      const isConfigured = await walletSigAuth.isConfigured(keyVaultAddress);
      return isConfigured;
    } catch (error) {
      throw new Error(`Failed to check if wallet is configured: ${error.message}`);
    }
  }

  /**
   * Check if an address is whitelisted for a wallet
   * 
   * @param {Object} options - Is whitelisted options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {String} options.addressToCheck - Address to check if it is whitelisted
   * @returns {Promise<Boolean>} True if address is whitelisted, false otherwise
   */
  async isWhitelisted(options = {}) {
    const { keyVaultAddress, addressToCheck } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    if (!addressToCheck || typeof addressToCheck !== 'string') {
      throw new Error('Address to check is required');
    }

    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.readProvider, this.addresses.walletSignatureAuth);

    try {
      const isWhitelisted = await walletSigAuth.isWhitelisted(keyVaultAddress, addressToCheck);
      return isWhitelisted;
    } catch (error) {
      throw new Error(`Failed to check if address is whitelisted: ${error.message}`);
    }
  }

  /**
   * Get all whitelisted addresses for a wallet
   * 
   * @param {Object} options - Get whitelist options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @returns {Promise<Array<String>>} Whitelist addresses
   */
  async getWhitelist(options = {}) {
    const { keyVaultAddress } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('Wallet address is required');
    }
    
    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.readProvider, this.addresses.walletSignatureAuth);

    try {
      const whitelist = await walletSigAuth.getWhitelist(keyVaultAddress);
      return whitelist;
    } catch (error) {
      throw new Error(`Failed to get whitelist: ${error.message}`);
    }
  }

  /**
   * Get the EIP-712 domain seperator
   * 
   * @returns {Promise<Bytes32>} EIP-712 domain seperator
   */
  async getDomainSeparator() {
    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.readProvider, this.addresses.walletSignatureAuth);

    try {
      const domainSeparator = await walletSigAuth.domainSeparator();
      return domainSeparator;
    } catch (error) {
      throw new Error(`Failed to get domain separator: ${error.message}`);
    }
  }

  /**
   * Change the password of a wallet
   * 
   * @param {Object} options - Change password options
   * @param {String} options.address - KeyVault address of the wallet
   * @param {Bytes} options.currentPassword - raw password bytes (utf8 encoded string)
   * @param {Bytes32} options.newPasswordHash - New password hash (bytes32)
   * @returns {Promise<Object>} Change password result
   */
  async changePassword(options = {}) {
    const { keyVaultAddress, currentPassword, newPasswordHash } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (!currentPassword) {
      throw new Error('Current password is required');
    }

    if (!newPasswordHash) {
      throw new Error('New password hash is required');
    }

    const passwordAuth = getPasswordAuthenticatorContract(this.writeSigner, this.addresses.passwordAuth);

    try {
      const tx = await passwordAuth.changePassword(keyVaultAddress, currentPassword, newPasswordHash);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse PasswordChanged event
      const eventData = parsePasswordChangedEvent(receipt, passwordAuth);
      
      if (!eventData) {
        throw new Error('PasswordChanged event not found in transaction receipt');
      }

      const result = {
        success: true,
        walletAddress: eventData.wallet,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  /**
   * Check if a wallet is configured (via passwordAuthenticator contract)
   * 
   * @param {Object} options - Check if wallet is configured options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<Boolean>} True if wallet is configured, false otherwise
   */
  async isConfigured(options = {}) {
    const { keyVaultAddress } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    const passwordAuth = getPasswordAuthenticatorContract(this.readProvider, this.addresses.passwordAuth);

    try {
      const isConfigured = await passwordAuth.isConfigured(keyVaultAddress);
      return isConfigured;
    } catch (error) {
      throw new Error(`Failed to check if wallet is configured: ${error.message}`);
    }
  }

  // KeyVault methods moved to KeyVaultClient
}

module.exports = Monstera;

