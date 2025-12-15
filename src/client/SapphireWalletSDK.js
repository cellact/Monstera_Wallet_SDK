/**
 * Sapphire Wallet SDK
 * 
 * Main SDK class for interacting with Oasis Sapphire wallet contracts.
 * Provides clean API for read and write operations.
 */

const { createSdkConfig } = require('../config/networks');
const { getReadProvider, getWriteSigner } = require('../provider/sapphire');
const { generateMnemonic, deriveSeed, hashPassword, createAuthProof } = require('../crypto/wallet');
const { getWalletFactoryContract, parseWalletCreatedEvent } = require('../contracts/core/walletFactory');
const { getWalletLogicContract } = require('../contracts/core/walletLogic');
const { getWalletSignatureAuthenticatorContract } = require('../contracts/authenticators/WalletSignatureAuthenticator');
const { ethers, Wallet, HDNodeWallet } = require('ethers');

/**
 * Sapphire Wallet SDK
 * 
 * Main entry point for wallet operations on Oasis Sapphire.
 * 
 */
class SapphireWalletSDK {
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
    
    // Namespace for wallet operations
    this.wallets = {
      createWallet: this.createWallet.bind(this),
      walletCount: this.walletCount.bind(this),
      isWallet: this.isWallet.bind(this),
      implementation: this.implementation.bind(this),
      getKeyVault: this.getKeyVault.bind(this),
      getAuthenticator: this.getAuthenticator.bind(this),
      getAccountAddress: this.getAccountAddress.bind(this),
      // getAccount: this.getAccount.bind(this),
      signMessage: this.signMessage.bind(this),
      sign: this.sign.bind(this),
      createAuthProof: this.createAuthProof.bind(this),
      addToWhitelist: this.addToWhitelist.bind(this),
      isWhitelisted: this.isWhitelisted.bind(this),
      getWhitelist: this.getWhitelist.bind(this)
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
   * @returns {SapphireWalletSDK} SDK instance
   */
  static fromConfig(options) {
    const config = createSdkConfig(options);
    return new SapphireWalletSDK(config);
  }

  /**
   * Create a new wallet
   * 
   * @param {Object} options - Wallet creation options
   * @param {Bytes} options.authConfig - Authentication configuration (bytes)
   * @param {String} options.authenticator - Authenticator contract address (optional, dafaults to PasswordAuthenticator)
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   */
  async createWallet(options = {}) {
    const { authConfig, authenticator = this.addresses.passwordAuth } = options;

    // TODO: check that passwordHash is correct type (bytes)
    if (!authConfig) {
      throw new Error('Auth config is required');
    }

    // TODO: check in a mapping if authConfig is valid (either password hash or whitelist)

    // if (!this.addresses.factory) {
    //   throw new Error('Factory address is required. Set it in config.addresses.factory');
    // }

    // if (!authenticator) {
    //   throw new Error('Authenticator address is required. Set it in config.addresses.passwordAuth');
    // }

    // Off-chain: Generate mnemonic
    const mnemonic = generateMnemonic();
    
    // Off-chain: Derive seed from mnemonic
    const seed = deriveSeed(mnemonic);
    
    // On-chain: Get factory contract with wrapped signer
    const factory = getWalletFactoryContract(this.writeSigner, this.addresses.factory);
    
    // On-chain: Call createWallet
    try {
      const tx = await factory.createWallet(
        seed, // bytes seed
        authenticator, // address authenticator
        authConfig // bytes authConfig
      );
      
      // Wait for transaction
      const receipt = await tx.wait();

      // Parse WalletCreated event
      const eventData = parseWalletCreatedEvent(receipt, factory);
      
      if (!eventData) {
        throw new Error('WalletCreated event not found in transaction receipt');
      }

      // TODO: hash the mnemonic and return it hashed? 
      
      // Build result
      const result = {
        success: true,
        wallet: eventData.wallet,
        mnemonic: mnemonic,
        authenticator: eventData.authenticator,
        keyVault: eventData.keyVault,
        storage: eventData.storage, // Storage contract address
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
      return result;
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Get the number of wallets created
   * 
   * @returns {Promise<Number>} Number of wallets created
   */
  async walletCount() {
    const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

    try {
      const count = await factory.walletCount();
      return count;
    } catch (error) {
      throw new Error(`Failed to get wallet count: ${error.message}`);
    }
  }

  /**
   * Check if an address is a wallet created by this factory
   * 
   * @param {Object} options - Is wallet options
   * @param {String} options.walletAddress - Wallet address to check
   * @returns {Promise<Boolean>} True if address is a wallet created by this factory, false otherwise
   */
  async isWallet(options = {}) {
    const { walletAddress } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

    try {
      const isWallet = await factory.isWallet(walletAddress);
      return isWallet;
    } catch (error) {
      throw new Error(`Failed to check if address is a wallet created by this factory: ${error.message}`);
    }
  }

  /**
   * Get current WalletLogic implementation
   * 
   * @returns {Promise<String>} Current WalletLogic implementation
   */
  async implementation() {
    const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

    try {
      const implementation = await factory.implementation();
      return implementation;
    } catch (error) {
      throw new Error(`Failed to get current WalletLogic implementation: ${error.message}`);
    }
  }

  /**
   * Get the key vault address for a wallet
   * 
   * @param {Object} options - Key vault options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} Key vault address
   */
  async getKeyVault(options = {}) {
    const { walletAddress } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    const logic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const keyVault = await logic.getKeyVault();
      return keyVault;
    } catch (error) {
      throw new Error(`Failed to get key vault address: ${error.message}`);
    }
  }

  /**
   * Get the authenticator address
   * 
   * @param {Object} options - Authenticator options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} Authenticator address
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
   * Get account address from wallet
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

  // async getAccountAddresses(options = {}) {
  //   const { walletAddress, fromIndex, count } = options;

  //   if (!walletAddress || typeof walletAddress !== 'string') {
  //     throw new Error('Wallet address is required');
  //   }
    
    
  // }

  // /**
  //  * Get account private key and address
  //  * 
  //  * @param {Object} options - Account options
  //  * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
  //  * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
  //  * @param {Number} options.index - Account index
  //  * @returns {Promise<Object>} Account
  //  */
  // async getAccount(options = {}) {
  //   const { walletAddress, authProof, index } = options;

  //   if (!walletAddress || typeof walletAddress !== 'string') {
  //     throw new Error('Wallet address is required');
  //   }

  //   // TODO: check that authProof is correct type (bytes)
  //   if (!authProof) {
  //     throw new Error('Auth proof is required');
  //   }
    
  //   if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
  //     throw new Error('Index is required and must be a non-negative integer');
  //   }

  //   const walletLogic = getWalletLogicContract(this.readProvider, walletAddress);

  //   try {
  //     const { privateKey, account } = await walletLogic.getAccount(authProof, index);
  //     const result = {
  //       success: true,
  //       privateKey: privateKey.toString(),
  //       accountAddress: account
  //     };

  //     return result;
  //   } catch (error) {
  //     throw new Error(`Failed to get account: ${error.message}`);
  //   }
  // }

  /**
   * Sign a message with an account's private key
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
      const result = {
        success: true,
        signature: signature
      };
      return result;
    } catch (error) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  /**
   * Sign a hash with an account's private key
   * 
   * @param {Object} options - Sign hash options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {Number} options.index - Account index
   * @param {Bytes} options.hash - Hash to sign
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
      const result = {
        success: true,
        signature: signature
      };
      return result;
    } catch (error) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  async createAuthProof(options = {}) {
    // const { authenticateFor, signer, authenticator, deadline } = options;
    const { authenticateFor, signer } = options;
    let { authenticator, deadline } = options;

    if (!authenticateFor || typeof authenticateFor !== 'string') {
      throw new Error('Authenticate for is required and must be a string');
    }

    if (!signer || !(signer instanceof Wallet || signer instanceof HDNodeWallet)) {
      throw new Error('Signer must be a Wallet or HDNodeWallet');
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

    // get chainId from config
    const chainId = this.chainId;

    const authProof = await createAuthProof(authenticateFor, signer, chainId, authenticator, deadline);

    // console.log('[createAuthProof] Auth proof:', authProof);

    return authProof;
  }

  /**
   * Add a new address to the whitelist
   * 
   * @param {Object} options - Add to whitelist options
   * @param {String} options.walletAddress - Wallet address 
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {String} options.newAddress - New address to add to the whitelist
   * @returns {Promise<Object>} Transaction receipt
   */
  async addToWhitelist(options = {}) {
    const { walletAddress, authProof, newAddress } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
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
      const tx = await walletSigAuth.addToWhitelist(walletAddress, authProof, newAddress);
      const receipt = await tx.wait();
      
      // console.log('[addToWhitelist] Transaction receipt:', receipt);

      return receipt;
    } catch (error) {
      throw new Error(`Failed to add to whitelist: ${error.message}`);
    }
  }

  /**
   * Check if an address is whitelisted
   * 
   * @param {Object} options - Is whitelisted options
   * @param {String} options.walletAddress - Wallet address 
   * @param {String} options.addressToCheck - Address to check if it is whitelisted
   * @returns {Promise<Boolean>} True if address is whitelisted, false otherwise
   */
  async isWhitelisted(options = {}) {
    const { walletAddress, addressToCheck } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    if (!addressToCheck || typeof addressToCheck !== 'string') {
      throw new Error('Address to check is required');
    }

    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.readProvider, this.addresses.walletSignatureAuth);

    try {
      const isWhitelisted = await walletSigAuth.isWhitelisted(walletAddress, addressToCheck);
      return isWhitelisted;
    } catch (error) {
      throw new Error(`Failed to check if address is whitelisted: ${error.message}`);
    }
  }

  /**
   * Get the whitelist for a wallet
   * 
   * @param {Object} options - Get whitelist options
   * @param {String} options.walletAddress - Wallet address 
   * @returns {Promise<Array<String>>} Whitelist addresses
   */
  async getWhitelist(options = {}) {
    const { walletAddress } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }
    
    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.readProvider, this.addresses.walletSignatureAuth);

    try {
      const whitelist = await walletSigAuth.getWhitelist(walletAddress);
      return whitelist;
    } catch (error) {
      throw new Error(`Failed to get whitelist: ${error.message}`);
    }
  }
}

module.exports = SapphireWalletSDK;

