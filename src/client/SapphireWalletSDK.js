/**
 * Sapphire Wallet SDK
 * 
 * Main SDK class for interacting with Oasis Sapphire wallet contracts.
 * Provides clean API for read and write operations.
 */

const { createSdkConfig } = require('../config/networks');
const { getReadProvider, getWriteSigner } = require('../provider/sapphire');
const { generateMnemonic, deriveSeed, hashPassword, createAuthProof } = require('../crypto/wallet');
const { getWalletFactoryContract, parseWalletCreatedEvent, parseBeaconUpgradedEvent } = require('../contracts/core/walletFactory');
const { getWalletLogicContract, parseAuthenticatorChangedEvent } = require('../contracts/core/walletLogic');
const { getWalletSignatureAuthenticatorContract, parseWhitelistRemovedEvent } = require('../contracts/authenticators/WalletSignatureAuthenticator');
const { ethers, Wallet, HDNodeWallet } = require('ethers');
const { getKeyVaultContract, parseImplementationUpgradedEvent } = require('../contracts/core/keyVault');
const { getPasswordAuthenticatorContract, parsePasswordChangedEvent } = require('../contracts/authenticators/PasswordAuthenticator');

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
      // WalletFactory functions
      createWallet: this.createWallet.bind(this),
      walletCount: this.walletCount.bind(this),
      isWallet: this.isWallet.bind(this),
      implementation: this.implementation.bind(this),
      getDefaultKeyVaultImpl: this.getDefaultKeyVaultImpl.bind(this),
      upgradeLogic: this.upgradeLogic.bind(this), // Admin function
      transferAdmin: this.transferAdmin.bind(this), // Admin function
      getAdmin: this.getAdmin.bind(this), // Admin function
      getWalletKeyVault: this.getWalletKeyVault.bind(this),
      getBeaconAddr: this.getBeaconAddr.bind(this),

      // WalletLogic functions
      isInitialized: this.isInitialized.bind(this),
      getKeyVault: this.getKeyVault.bind(this),
      getAuthenticator: this.getAuthenticator.bind(this),
      getAccountAddress: this.getAccountAddress.bind(this),
      getAccountAddresses: this.getAccountAddresses.bind(this),
      signTransaction: this.signTransaction.bind(this),
      signMessage: this.signMessage.bind(this),
      sign: this.sign.bind(this),
      // changeAuthenticator: this.changeAuthenticator.bind(this), // not fully implemented yet (needs to be tested)
      upgradeKeyVault: this.upgradeKeyVault.bind(this),
      createAuthProof: this.createAuthProof.bind(this),

      // WalletSignatureAuthenticator functions
      // verify: this.verify.bind(this),
      // configure: this.configure.bind(this),
      addToWhitelist: this.addToWhitelist.bind(this),
      removeFromWhitelist: this.removeFromWhitelist.bind(this),
      // isConfigured: this.isConfigured.bind(this),
      isWhitelisted: this.isWhitelisted.bind(this),
      getWhitelist: this.getWhitelist.bind(this),
      // domainSeparator: this.domainSeparator.bind(this),

      // PasswordAuthenticator functions
      // verify: this.verify.bind(this),
      // configure: this.configure.bind(this),
      changePassword: this.changePassword.bind(this),
      isConfigured: this.isConfigured.bind(this),

      // KeyVault functions
      // initialize: this.initialize.bind(this),
      getKeyVaultImplementation: this.getKeyVaultImplementation.bind(this), // implementation in keyVault contract
      upgradeKeyVaultImpl: this.upgradeKeyVaultImpl.bind(this), // upgradeImplementation in keyVault contract
      // changeAuthenticator: this.changeAuthenticator.bind(this),
      // getAccountAddress: this.getAccountAddress.bind(this),
      // getAccountAddresses: this.getAccountAddresses.bind(this),
      // signTransaction: this.signTransaction.bind(this),
      // signMessage: this.signMessage.bind(this),
      // sign: this.sign.bind(this),
      // executeWithAuth: this.executeWithAuth.bind(this),
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

  async getDefaultKeyVaultImpl() {
    const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

    try {
      const defaultKeyVaultImpl = await factory.getDefaultKeyVaultImpl();
      return defaultKeyVaultImpl;
    } catch (error) {
      throw new Error(`Failed to get default key vault implementation: ${error.message}`);
    }
  }

  /**
   * Upgrade the logic of a wallet (Admin function)
   * 
   * @param {Object} options - Upgrade logic options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {String} options.newLogicAddress - New walletLogic contract address
   * @returns {Promise<Object>} Upgrade logic result
   */
  async upgradeLogic(options = {}) {
    const { newLogicAddress } = options;

    if (!newLogicAddress || typeof newLogicAddress !== 'string') {
      throw new Error('New logic address is required');
    }

    const factory = getWalletFactoryContract(this.writeSigner, this.addresses.factory);

    try {
      const tx = await factory.upgradeLogic(newLogicAddress);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse BeaconUpgraded event
      const eventData = parseBeaconUpgradedEvent(receipt, factory);
      
      if (!eventData) {
        throw new Error('BeaconUpgraded event not found in transaction receipt');
      }

      const result = {
        success: true,
        oldImpl: eventData.oldImpl,
        newLogic: eventData.newLogic,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to upgrade logic: ${error.message}`);
    }
    
  }

  /**
   * Transfer admin ownership to a new address (Admin function)
   * 
   * @param {Object} options - Transfer admin options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {String} options.newAdminAddress - New admin address
   * @returns {Promise<Object>} Transfer admin result
   */
  async transferAdmin(options = {}) {
    const { newAdminAddress } = options;

    if (!newAdminAddress || typeof newAdminAddress !== 'string') {
      throw new Error('New admin address is required');
    }

    const factory = getWalletFactoryContract(this.writeSigner, this.addresses.factory);

    try {
      const tx = await factory.transferAdmin(newAdminAddress);

      // Wait for transaction
      const receipt = await tx.wait();

      const result = {
        success: true,
        newAdmin: newAdminAddress,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
      return result;
    } catch (error) {
      throw new Error(`Failed to transfer admin: ${error.message}`);
    }
  }

  /**
   * Get the admin address (for wallet factory)
   * 
   * @returns {Promise<String>} Admin address
   */
  async getAdmin() {
    const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

    try {
      const admin = await factory.admin();
      return admin;
    } catch (error) {
      throw new Error(`Failed to get admin address: ${error.message}`);
    }
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

  /**
   * Get the beacon address for a wallet (from wallet factory)
   * 
   * The beacon controlling WalletLogic upgrades
   * 
   * @returns {Promise<String>} Beacon address
   */
  async getBeaconAddr() {

    const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

    try {
      const beaconAddr = await factory.beacon();
      return beaconAddr;
    } catch (error) {
      throw new Error(`Failed to get beacon address: ${error.message}`);
    }
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
   * Get the authenticator address
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
   * Sign a raw transaction with an account's private key
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
   * Sign a Sign a 32-byte hash with an account's private key
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
      const eventData = parseAuthenticatorChangedEvent(receipt, walletLogic);
      console.log("[changeAuthenticator] Event data:", eventData);
      
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

  async createAuthProof(options = {}) {
    // const { authenticateFor, signer, authenticator, deadline } = options;
    const { authenticateFor, signer, keyVault } = options;
    let { authenticator, deadline } = options;

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

    // get chainId from config
    const chainId = this.chainId;

    const authProof = await createAuthProof(signer, chainId, authenticator, deadline, keyVault);

    return authProof;
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
      const receipt = await tx.wait();
      
      return receipt;
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

      // Parse WhitelistRemoved event
      const eventData = parseWhitelistRemovedEvent(receipt, walletSigAuth);
      console.log("[removeFromWhitelist] Event data:", eventData);
      
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
   * Check if an address is whitelisted
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
   * Get the whitelist for a wallet
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
   * Change the password of a wallet
   * 
   * @param {Object} options - Change password options
   * @param {String} options.address - KeyVault address of the wallet
   * @param {Bytes} options.currentPassword - raw password bytes (utf8 encoded string)
   * @param {Bytes32} options.newPasswordHash - New password hash (bytes32)
   * @returns {Promise<Object>} Change password result
   */
  async changePassword(options = {}) {
    const { address, currentPassword, newPasswordHash } = options;

    if (!address || typeof address !== 'string') {
      throw new Error('Wallet address is required');
    }

    if (!currentPassword) {
      throw new Error('Current password is required');
    }

    if (!newPasswordHash) {
      throw new Error('New password hash is required');
    }

    const passwordAuth = getPasswordAuthenticatorContract(this.writeSigner, this.addresses.passwordAuth);

    try {
      const tx = await passwordAuth.changePassword(address, currentPassword, newPasswordHash);

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
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<Boolean>} True if wallet is configured, false otherwise
   */
  async isConfigured(options = {}) {
    const { walletAddress } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    const passwordAuth = getPasswordAuthenticatorContract(this.readProvider, this.addresses.passwordAuth);

    try {
      const isConfigured = await passwordAuth.isConfigured(walletAddress);
      return isConfigured;
    } catch (error) {
      throw new Error(`Failed to check if wallet is configured: ${error.message}`);
    }
  }

  /**
   * Get the keyVaultImplementation contract address (from keyVault contract)
   * 
   * @returns {Promise<String>} KeyVaultImplementation address
   */
  async getKeyVaultImplementation() {
    const keyVault = getKeyVaultContract(this.readProvider, this.addresses.keyVault);

    try {
    const keyVaultImplAddr = await keyVault.implementation();
    return keyVaultImplAddr;
  } catch (error) {
      throw new Error(`Failed to get key vault implementation: ${error.message}`);
    }
  }

  /**
   * Upgrade the keyVaultImplementation (via keyVault contract) (User-only)
   * 
   * @param {Object} options - Upgrade keyVaultImplementation options
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {String} options.newImplAddr - New keyVaultImplementation contract address
   * @returns {Promise<Object>} Upgrade keyVaultImplementation result
   */
  async upgradeKeyVaultImpl(options = {}) {
    const { authProof, newImplAddr } = options;

    if (!authProof) {
      throw new Error('Auth proof is required');
    }
    if (!newImplAddr || typeof newImplAddr !== 'string') {
      throw new Error('New key vault implementation address is required');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, this.addresses.keyVault);

    try {
      const tx = await keyVault.upgradeImplementation(authProof, newImplAddr);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse ImplementationUpgraded event
      const eventData = parseImplementationUpgradedEvent(receipt, keyVault);
      console.log("[upgradeKeyVaultImpl] Event data:", eventData);
      
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

}

module.exports = SapphireWalletSDK;

