/**
 * Monstera Wallet SDK
 * 
 * Main SDK class for interacting with Monstera wallet contracts.
 * Provides clean API for read and write operations.
 */

const { createSdkConfig } = require('../config/networks');
const { getReadProvider, getWriteSigner } = require('../provider/sapphire');
const { createAuthProof } = require('../crypto/wallet');
const { Wallet, HDNodeWallet } = require('ethers');
const WalletFactoryClient = require('../packages/factory');
const WalletLogicClient = require('../packages/logic');
const KeyVaultClient = require('../packages/keyVault');
const { AuthenticatorClient } = require('../packages/auth');
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

    // Initialize authenticator client registry (manages all authenticator clients)
    this.auth = new AuthenticatorClient(this.readProvider, this.writeSigner, config);

    // Namespace for wallet operations
    this.wallets = {
      // SDK function - no contract call 
      createAuthProof: this.createAuthProof.bind(this),
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

  // Authenticator methods moved to authenticator clients
}

module.exports = Monstera;

