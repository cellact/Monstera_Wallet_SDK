/**
 * WalletFactoryClient
 * 
 * Client for interacting with WalletFactory contract methods.
 * Handles wallet creation and factory administration.
 */

const BaseContractClient = require('../../base/BaseContractClient');
const { getWalletFactoryContract } = require('../../contracts/core/walletFactory');
const { WalletFactoryEvents } = require('../../events');
const { generateMnemonic, deriveSeed } = require('../../crypto/wallet');
const { requireBytes, requireAddress } = require('../../internal/assert');

class WalletFactoryClient extends BaseContractClient {
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

  /**
   * Prepare wallet creation by generating mnemonic and deriving seed
   * 
   * @private
   * @returns {Object} Object containing mnemonic and seed
   * @returns {String} returns.mnemonic - Generated mnemonic phrase
   * @returns {String} returns.seed - Derived seed from mnemonic
   */
  _prepareWalletCreation() {
    // Off-chain: Generate mnemonic
    const mnemonic = generateMnemonic();
    
    // Off-chain: Derive seed from mnemonic
    const seed = deriveSeed(mnemonic);
    
    return { mnemonic, seed };
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
    const { authConfig } = options;
    let { authenticator } = options;

    requireBytes(authConfig, 'authConfig');

    // Set default authenticator if not provided
    if (!authenticator) {
      authenticator = this.config.addresses.passwordAuth;
    }

    // Off-chain: Prepare wallet creation (mnemonic + seed)
    const { mnemonic, seed } = this._prepareWalletCreation();
    
    // On-chain: Get factory contract
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    // On-chain: Call createWallet
    try {
      const result = await this.sendTx(
        () => factory.createWallet(seed, authenticator, authConfig),
        {
          parseEvents: [{
            eventDef: WalletFactoryEvents.WalletCreated,
            contract: factory
          }],
          extraData: { mnemonic }
        }
      );
      
      return result;
    } catch (error) {
      throw this.wrapError('create wallet', error, {
        ...options,
        factoryAddress: this.config.addresses.factory,
        authenticator: authenticator || this.config.addresses.passwordAuth
      });
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
    const { authConfig, hook, hookData } = options;
    let { authenticator } = options;

    requireBytes(authConfig, 'authConfig');
    requireAddress(hook, 'hook');
    requireBytes(hookData, 'hookData');

    // Set default authenticator if not provided
    if (!authenticator) {
      authenticator = this.config.addresses.passwordAuth;
    }

    // Off-chain: Prepare wallet creation (mnemonic + seed)
    const { mnemonic, seed } = this._prepareWalletCreation();
    
    // On-chain: Get factory contract
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    // On-chain: Call createWalletWithHook
    try {
      const result = await this.sendTx(
        () => factory.createWalletWithHook(seed, authenticator, authConfig, hook, hookData),
        {
          parseEvents: [{
            eventDef: WalletFactoryEvents.WalletCreated,
            contract: factory
          }],
          extraData: { mnemonic }
        }
      );
      
      return result;
    } catch (error) {
      throw this.wrapError('create wallet with hook', error, {
        ...options,
        factoryAddress: this.config.addresses.factory,
        authenticator: authenticator || this.config.addresses.passwordAuth
      });
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
    const { authConfig } = options;
    let { authenticator } = options;

    requireBytes(authConfig, 'authConfig');

    // Set default authenticator if not provided
    if (!authenticator) {
      authenticator = this.config.addresses.passwordAuth;
    }

    // Off-chain: Prepare wallet creation (mnemonic + seed)
    const { mnemonic, seed } = this._prepareWalletCreation();
    
    // On-chain: Get factory contract
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    // On-chain: Call createWalletCore
    try {
      const result = await this.sendTx(
        () => factory.createWalletCore(seed, authenticator, authConfig),
        {
          parseEvents: [{
            eventDef: WalletFactoryEvents.WalletCreated,
            contract: factory
          }],
          extraData: { mnemonic }
        }
      );
      
      return result;
    } catch (error) {
      throw this.wrapError('create wallet core', error, {
        ...options,
        factoryAddress: this.config.addresses.factory,
        authenticator: authenticator || this.config.addresses.passwordAuth
      });
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
    const { authConfig, customLogicImpl, logicData } = options;
    let { authenticator } = options;

    requireBytes(authConfig, 'authConfig');
    requireAddress(customLogicImpl, 'customLogicImpl');
    requireBytes(logicData, 'logicData');

    // Set default authenticator if not provided
    if (!authenticator) {
      authenticator = this.config.addresses.passwordAuth;
    }

    // Off-chain: Prepare wallet creation (mnemonic + seed)
    const { mnemonic, seed } = this._prepareWalletCreation();
    
    // On-chain: Get factory contract
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    // On-chain: Call createWalletWithCustomLogic
    try {
      const result = await this.sendTx(
        () => factory.createWalletWithCustomLogic(seed, authenticator, authConfig, customLogicImpl, logicData),
        {
          parseEvents: [{
            eventDef: WalletFactoryEvents.WalletCreated,
            contract: factory
          }],
          extraData: { mnemonic }
        }
      );
      
      return result;
    } catch (error) {
      throw this.wrapError('create wallet with custom logic', error, {
        ...options,
        factoryAddress: this.config.addresses.factory,
        authenticator: authenticator || this.config.addresses.passwordAuth
      });
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

    requireAddress(walletAddress, 'walletAddress');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    try {
      const isWallet = await factory.isWallet(walletAddress);
      return isWallet;
    } catch (error) {
      throw this.wrapError('check if address is wallet', error, {
        ...options,
        factoryAddress: this.config.addresses.factory
      });
    }
  }

  /**
   * Get current WalletLogic implementation (current walletLogic contract address)
   * 
   * @returns {Promise<String>} Current WalletLogic implementation
   */
  async getWalletLogicImplAddr(options = {}) {
    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory); 

    try {
      const implementation = await factory.implementation();
      return implementation;
    } catch (error) {
      throw this.wrapError('get wallet logic implementation', error, {
        ...options,
        factoryAddress: this.config.addresses.factory
      });
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

    requireAddress(newLogicAddress, 'newLogicAddress');

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    try {
      const result = await this.sendTx(
        () => factory.upgradeLogic(newLogicAddress),
        {
          parseEvents: [{
            eventDef: WalletFactoryEvents.BeaconUpgraded,
            contract: factory
          }]
        }
      );

      return result;
    } catch (error) {
      throw this.wrapError('upgrade wallet logic', error, {
        ...options,
        factoryAddress: this.config.addresses.factory
      });
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

    requireAddress(newAdminAddress, 'newAdminAddress');

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    try {
      const result = await this.sendTx(
        () => factory.transferAdmin(newAdminAddress),
        {
          parseEvents: [],
          extraData: { newAdmin: newAdminAddress }
        }
      );
      
      return result;
    } catch (error) {
      throw this.wrapError('transfer admin', error, {
        ...options,
        factoryAddress: this.config.addresses.factory
      });
    }
  }

  /**
   * Get the admin address
   * 
   * @returns {Promise<String>} Admin address
   */
  async getAdmin(options = {}) {
    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    try {
      const admin = await factory.admin();
      return admin;
    } catch (error) {
      throw this.wrapError('get admin', error, {
        ...options,
        factoryAddress: this.config.addresses.factory
      });
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

    requireAddress(walletAddress, 'walletAddress');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    try {
      const keyVaultAddr = await factory.walletKeyVault(walletAddress);
      return keyVaultAddr;
    } catch (error) {
      throw this.wrapError('get wallet key vault', error, {
        ...options,
        factoryAddress: this.config.addresses.factory
      });
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

    requireAddress(walletAddress, 'walletAddress');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    try {
      const storageAddr = await factory.walletStorage(walletAddress);
      return storageAddr;
    } catch (error) {
      throw this.wrapError('get storage address', error, {
        ...options,
        factoryAddress: this.config.addresses.factory
      });
    }
  }

  /**
   * Get the beacon address for a wallet 
   * 
   * The beacon controlling WalletLogic upgrades
   * 
   * @returns {Promise<String>} Beacon address
   */
  async getBeaconAddr(options = {}) {
    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    try {
      const beaconAddr = await factory.beacon();
      return beaconAddr;
    } catch (error) {
      throw this.wrapError('get beacon address', error, {
        ...options,
        factoryAddress: this.config.addresses.factory
      });
    }
  }
}

module.exports = WalletFactoryClient;

