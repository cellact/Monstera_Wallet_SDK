/**
 * WalletFactoryClient
 * 
 * Client for interacting with WalletFactory contract methods.
 * Handles wallet creation and factory administration.
 */

const { getWalletFactoryContract } = require('../../contracts/core/walletFactory');
const { parseEventFromReceipt, WalletFactoryEvents } = require('../../events');
const { generateMnemonic, deriveSeed } = require('../../crypto/wallet');

class WalletFactoryClient {
  constructor(readProvider, writeSigner, config) {
    this.readProvider = readProvider;
    this.writeSigner = writeSigner;
    this.config = config;
    this.addresses = config.addresses;
    this.contractAddress = config.addresses.factory;
  }

  /**
   * Create a new HD Wallet
   * 
   * Deploys complete wallet stack:
   *      1. WalletStorage (holds keys, locked to KeyVault)
   *      2. KeyVault (auth + signing, user-upgradeable)
   *      3. WalletLogic proxy (orchestration, admin-upgradeable)
   * 
   * @param {Object} options - Wallet creation options
   * @param {String} options.authenticator - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   */
  async createWallet(options = {}) {
    const { authenticator = this.addresses.passwordAuth, authConfig } = options;

    if (!authConfig) {
      throw new Error('Auth config is required');
    }

    // Off-chain: Generate mnemonic
    const mnemonic = generateMnemonic();
    
    // Off-chain: Derive seed from mnemonic
    const seed = deriveSeed(mnemonic);
    
    // On-chain: Get factory contract with wrapped signer
    const factory = getWalletFactoryContract(this.writeSigner, this.contractAddress);
    
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
      const eventData = parseEventFromReceipt(
        WalletFactoryEvents.WalletCreated,
        receipt, 
        factory
      );
      
      if (!eventData) {
        throw new Error('WalletCreated event not found in transaction receipt');
      }
      
      // Build result
      const result = {
        success: true,
        wallet: eventData.wallet,
        mnemonic: mnemonic,
        authenticator: eventData.authenticator,
        keyVault: eventData.keyVault,
        storage: eventData.storage,
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
   * Create a new HD wallet with a post-creation hook
   * 
   * Deploys complete wallet stack:
   *      1. WalletStorage (holds keys, locked to KeyVault)
   *      2. KeyVault (auth + signing, user-upgradeable)
   *      3. WalletLogic proxy (orchestration, admin-upgradeable)
   * 
   * The hook is called after the wallet is created.
   * The hook contract must implement IWalletCreationHook interface.
   * 
   * @param {Object} options - Wallet creation options
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @param {String} options.authenticator - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {String} options.hook - Hook contract address
   * @param {Bytes} options.hookData - Data for the hook
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   */
  async createWalletWithHook(options = {}) {
    const { authenticator = this.addresses.passwordAuth, authConfig, hook, hookData } = options;

    if (!authConfig) {
      throw new Error('Auth config is required');
    }

    if (!hook) {
      throw new Error('Hook address is required');
    }

    if (!hookData) {
      throw new Error('Hook data is required');
    }

    // Off-chain: Generate mnemonic
    const mnemonic = generateMnemonic();
    
    // Off-chain: Derive seed from mnemonic
    const seed = deriveSeed(mnemonic);
    
    // On-chain: Get factory contract with wrapped signer
    const factory = getWalletFactoryContract(this.writeSigner, this.contractAddress);
    
    // On-chain: Call createWalletWithHook
    try {
      const tx = await factory.createWalletWithHook(
        seed, // bytes seed
        authenticator, // address authenticator
        authConfig, // bytes authConfig
        hook, // address hook
        hookData // bytes hookData
      );
      
      // Wait for transaction
      const receipt = await tx.wait();

      // Parse WalletCreated event
      const eventData = parseEventFromReceipt(
        WalletFactoryEvents.WalletCreated,
        receipt, 
        factory
      );

      if (!eventData) {
        throw new Error('WalletCreated event not found in transaction receipt');
      }
      
      // Build result
      const result = {
        success: true,
        wallet: eventData.wallet,
        mnemonic: mnemonic,
        authenticator: eventData.authenticator,
        keyVault: eventData.keyVault,
        storage: eventData.storage,
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
   * Create a new HD Wallet 
   * 
   * Deploys core wallet stack only:
   *      1. WalletStorage (holds keys, locked to KeyVault)
   *      2. KeyVault (KeyVault address is the wallet address)
   * 
   * Use this when you want to interact with KeyVault directly,
   * or when deploying your own custom logic contract separately.
   * 
   * @param {Object} options - Wallet creation options
   * @param {String} options.authenticator - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   */
  async createWalletCore(options = {}) {
    const { authenticator = this.addresses.passwordAuth, authConfig } = options;

    if (!authConfig) {
      throw new Error('Auth config is required');
    }

    // Off-chain: Generate mnemonic
    const mnemonic = generateMnemonic();
    
    // Off-chain: Derive seed from mnemonic
    const seed = deriveSeed(mnemonic);
    
    // On-chain: Get factory contract with wrapped signer
    const factory = getWalletFactoryContract(this.writeSigner, this.contractAddress);
    
    // On-chain: Call createWalletCore
    try {
      const tx = await factory.createWalletCore(
        seed, // bytes seed
        authenticator, // address authenticator
        authConfig // bytes authConfig
      );
      
      // Wait for transaction
      const receipt = await tx.wait();

      // Parse WalletCreated event
      const eventData = parseEventFromReceipt(
        WalletFactoryEvents.WalletCreated,
        receipt, 
        factory
      );

      if (!eventData) {
        throw new Error('WalletCreated event not found in transaction receipt');
      }
      
      // Build result
      const result = {
        success: true,
        wallet: eventData.wallet,
        mnemonic: mnemonic,
        authenticator: eventData.authenticator,
        keyVault: eventData.keyVault,
        storage: eventData.storage,
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
   * Create a new HD wallet with a custom logic contract
   * 
   * Deploys minimal wallet stack:
   *      1. WalletStorage (holds keys, locked to KeyVault)
   *      2. KeyVault (KeyVault address is the wallet address)
   * 
   * Deploys a minimal proxy (clone) of the customLogicImpl.
   * Unlike default BeaconProxy wallets:
   * - Custom logic wallets are NOT affected by admin beacon upgrades
   * - Each wallet gets its own independent clone
   * 
   * @param {Object} options - Wallet creation options
   * @param {String} options.authenticator - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @param {String} options.customLogicImpl - Custom logic implementation contract address (must implement IWalletLogic)
   * @param {Bytes} options.logicData - Initialization data for your custom logic
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   */
  async createWalletWithCustomLogic(options = {}) {
    const { authenticator = this.addresses.passwordAuth, authConfig, customLogicImpl, logicData } = options;

    if (!authConfig) {
      throw new Error('Auth config is required');
    }
    
    if (!customLogicImpl) {
      throw new Error('Custom logic implementation address is required');
    }
    
    if (!logicData) {
      throw new Error('Logic data is required');
    }

    // Off-chain: Generate mnemonic
    const mnemonic = generateMnemonic();
    
    // Off-chain: Derive seed from mnemonic
    const seed = deriveSeed(mnemonic);
    
    // On-chain: Get factory contract with wrapped signer
    const factory = getWalletFactoryContract(this.writeSigner, this.contractAddress);

    // On-chain: Call createWalletWithCustomLogic
    try {
      const tx = await factory.createWalletWithCustomLogic(
        seed, // bytes seed
        authenticator, // address authenticator
        authConfig, // bytes authConfig
        customLogicImpl, // address customLogicImpl
        logicData // bytes logicData
      );

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse WalletCreated event
      const eventData = parseEventFromReceipt(
        WalletFactoryEvents.WalletCreated,
        receipt, 
        factory
      );

      if (!eventData) {
        throw new Error('WalletCreated event not found in transaction receipt');
      }
      
      // Build result
      const result = {
        success: true,
        wallet: eventData.wallet,
        mnemonic: mnemonic,
        authenticator: eventData.authenticator,
        keyVault: eventData.keyVault,
        storage: eventData.storage,
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

    const factory = getWalletFactoryContract(this.readProvider, this.contractAddress);

    try {
      const isWallet = await factory.isWallet(walletAddress);
      return isWallet;
    } catch (error) {
      throw new Error(`Failed to check if address is a wallet created by this factory: ${error.message}`);
    }
  }

  /**
   * Get current WalletLogic implementation (current walletLogic contract address)
   * 
   * @returns {Promise<String>} Current WalletLogic implementation
   */
  async getWalletLogicImplAddr() {
    const factory = getWalletFactoryContract(this.readProvider, this.contractAddress);

    try {
      const implementation = await factory.implementation();
      return implementation;
    } catch (error) {
      throw new Error(`Failed to get current WalletLogic implementation: ${error.message}`);
    }
  }

  /**
   * Upgrade the WalletLogic implementation for all wallets (Admin function)
   * 
   * This upgrades the orchestration layer, not the key security.
   * 
   * @param {Object} options - Upgrade logic options
   * @param {String} options.newLogicAddress - New walletLogic contract address
   * @returns {Promise<Object>} Upgrade logic result
   */
  async upgradeWalletLogicImplAddr(options = {}) {
    const { newLogicAddress } = options;

    if (!newLogicAddress || typeof newLogicAddress !== 'string') {
      throw new Error('New logic address is required');
    }

    const factory = getWalletFactoryContract(this.writeSigner, this.contractAddress);

    try {
      const tx = await factory.upgradeLogic(newLogicAddress);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse BeaconUpgraded event
      const eventData = parseEventFromReceipt(
        WalletFactoryEvents.BeaconUpgraded,
        receipt, 
        factory
      );
      
      if (!eventData) {
        throw new Error('BeaconUpgraded event not found in transaction receipt');
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
      throw new Error(`Failed to upgrade logic: ${error.message}`);
    }
  }

  /**
   * Transfer admin ownership role to a new address (Admin function)
   * 
   * @param {Object} options - Transfer admin options
   * @param {String} options.newAdminAddress - New admin address
   * @returns {Promise<Object>} Transfer admin result
   */
  async transferAdmin(options = {}) {
    const { newAdminAddress } = options;

    if (!newAdminAddress || typeof newAdminAddress !== 'string') {
      throw new Error('New admin address is required');
    }

    const factory = getWalletFactoryContract(this.writeSigner, this.contractAddress);

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
   * Get the admin address
   * 
   * @returns {Promise<String>} Admin address
   */
  async getAdmin() {
    const factory = getWalletFactoryContract(this.readProvider, this.contractAddress);

    try {
      const admin = await factory.admin();
      return admin;
    } catch (error) {
      throw new Error(`Failed to get admin address: ${error.message}`);
    }
  }

  /**
   * Get the keyVault contract address for a wallet
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

    const factory = getWalletFactoryContract(this.readProvider, this.contractAddress);

    try {
      const keyVaultAddr = await factory.walletKeyVault(walletAddress);
      return keyVaultAddr;
    } catch (error) {
      throw new Error(`Failed to get wallet key vault address: ${error.message}`);
    }
  }

  /**
   * Get the storage contract address for a wallet
   * 
   * @param {Object} options - Storage options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} Storage contract address
   */
  async getStorageAddr(options = {}) {
    const { walletAddress } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    const factory = getWalletFactoryContract(this.readProvider, this.contractAddress);

    try {
      const storageAddr = await factory.walletStorage(walletAddress);
      return storageAddr;
    } catch (error) {
      throw new Error(`Failed to get wallet storage address: ${error.message}`);
    }
  }

  /**
   * Get the beacon address for a wallet 
   * 
   * The beacon controlling WalletLogic upgrades
   * 
   * @returns {Promise<String>} Beacon address
   */
  async getBeaconAddr() {
    const factory = getWalletFactoryContract(this.readProvider, this.contractAddress);

    try {
      const beaconAddr = await factory.beacon();
      return beaconAddr;
    } catch (error) {
      throw new Error(`Failed to get beacon address: ${error.message}`);
    }
  }
}

module.exports = WalletFactoryClient;

