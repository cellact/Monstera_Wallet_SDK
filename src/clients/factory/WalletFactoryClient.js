/**
 * WalletFactoryClient
 * 
 * Client for interacting with WalletFactory contract methods.
 * Handles wallet creation and factory administration.
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getWalletFactoryContract } from '../../contracts/core/walletFactory.js';
import { WalletFactoryEvents } from '../../events/index.js';
import { generateMnemonic, deriveSeed } from '../../crypto/wallet.js';
import { requireAddress, requireBytes, requireMnemonic } from '../../internal/assert.js';

class WalletFactoryClient extends BaseContractClient {
  // ============================================================================
  // Constructor
  // ============================================================================
  
  /**
   * @param {Object} readProvider - Ethers provider for read operations
   * @param {Object} writeSigner - Ethers signer for write operations
   * @param {Object} config - Configuration object
   */
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

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
   * Resolve authenticator contract address with default fallback
   * 
   * Standardizes default parameter handling for authenticator contract addresses.
   * If no authenticator contract address is provided, defaults to PasswordAuthenticator.
   * 
   * @private
   * @param {String} [authenticatorAddr] - Optional authenticator contract address
   * @returns {String} Authenticator address (provided or default)
   */
  _resolveAuthenticator(authenticatorAddr) {
    return authenticatorAddr || this.config.addresses.passwordAuth;
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Check if an address is a wallet created by this factory
   * 
   * @param {Object} options - Is wallet options
   * @param {String} options.walletAddr - Wallet address to check
   * @returns {Promise<Boolean>} True if address is a wallet created by this factory, false otherwise
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async isWallet(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      () => factory.isWallet(walletAddr),
      'check if address is wallet',
      {
        ...options,
        factoryAddress: this.config.addresses.factory
      }
    );
  }

  /**
   * Get the admin address
   * 
   * @param {Object} [options={}] - Options object
   * @returns {Promise<String>} Admin address
   */
  async getAdmin(options = {}) {
    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      () => factory.admin(),
      'get admin',
      {
        ...options,
        factoryAddress: this.config.addresses.factory
      }
    );
  }

  /**
   * Get current WalletLogic implementation (current walletLogic contract address)
   * 
   * @param {Object} [options={}] - Options object
   * @returns {Promise<String>} Current WalletLogic implementation
   */
  async getWalletLogicImplAddr(options = {}) {
    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      () => factory.implementation(),
      'get wallet logic implementation',
      {
        ...options,
        factoryAddress: this.config.addresses.factory
      }
    );
  }

  /**
   * Get the keyVault contract address for a wallet
   * 
   * @param {Object} options - KeyVault options
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getKeyVaultAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      () => factory.walletKeyVault(walletAddr),
      'get wallet key vault address',
      {
        ...options,
        factoryAddress: this.config.addresses.factory
      }
    );
  }

  /**
   * Get the storage contract address for a wallet
   * 
   * @param {Object} options - Storage options
   * @param {String} options.walletAddr - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} Storage contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getStorageAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      () => factory.walletStorage(walletAddr),
      'get storage address',
      {
        ...options,
        factoryAddress: this.config.addresses.factory
      }
    );
  }

  /**
   * Get the beacon address for a wallet 
   * 
   * The beacon controlling WalletLogic updates
   * 
   * @param {Object} [options={}] - Options object
   * @returns {Promise<String>} Beacon address
   */
  async getBeaconAddr(options = {}) {
    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      () => factory.beacon(),
      'get beacon address',
      {
        ...options,
        factoryAddress: this.config.addresses.factory
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Create a new HD Wallet
   * 
   * Deploys complete wallet stack:
   *      1. WalletStorage (holds keys, locked to KeyVault)
   *      2. KeyVault (auth + signing, user-updateable)
   *      3. WalletLogic proxy (orchestration, admin-updateable)
   * 
   * @param {Object} options - Wallet creation options
   * @param {String} [options.authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   * @throws {ValidationError} If authConfig is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   * 
   */
  async createWallet(options = {}) {
    const { authConfig } = options;
    requireBytes(authConfig, 'authConfig');

    const authenticatorAddr = this._resolveAuthenticator(options.authenticatorAddr);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      () => factory.createWallet(seed, authenticatorAddr, authConfig),
      'create wallet',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { mnemonic },
        factoryAddress: this.config.addresses.factory,
        authenticatorAddr
      }
    );
  }

  /**
   * Create a new HD Wallet from a provided mnemonic
   * 
   * Deploys complete wallet stack:
   *      1. WalletStorage (holds keys, locked to KeyVault)
   *      2. KeyVault (auth + signing, user-updateable)
   *      3. WalletLogic proxy (orchestration, admin-updateable)
   * 
   * @param {Object} options - Wallet creation options
   * @param {String} [options.authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @param {String} options.mnemonic - Mnemonic phrase (BIP39)
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   * @throws {ValidationError} If authConfig is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   * 
   */
  async createWalletFromMnemonic(options = {}) {
    const { authConfig, mnemonic } = options;
    requireBytes(authConfig, 'authConfig');
    requireMnemonic(mnemonic, 'mnemonic');

    const authenticatorAddr = this._resolveAuthenticator(options.authenticatorAddr);
    const seed = deriveSeed(mnemonic);
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      () => factory.createWallet(seed, authenticatorAddr, authConfig),
      'create wallet',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { mnemonic },
        factoryAddress: this.config.addresses.factory,
        authenticatorAddr
      }
    );
  }

  /**
   * Create a new HD wallet with a post-creation hook
   * 
   * Deploys complete wallet stack:
   *      1. WalletStorage (holds keys, locked to KeyVault)
   *      2. KeyVault (auth + signing, user-updateable)
   *      3. WalletLogic proxy (orchestration, admin-updateable)
   * 
   * The hook is called after the wallet is created.
   * The hook contract must implement IWalletCreationHook interface.
   * 
   * @param {Object} options - Wallet creation options
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @param {String} [options.authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {String} options.hookAddr - Hook contract address
   * @param {Bytes} options.hookData - Data for the hook
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async createWalletWithHook(options = {}) {
    const { authConfig, hookAddr, hookData } = options;
    requireBytes(authConfig, 'authConfig');
    requireAddress(hookAddr, 'hookAddr');
    requireBytes(hookData, 'hookData');

    const authenticatorAddr = this._resolveAuthenticator(options.authenticatorAddr);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      () => factory.createWalletWithHook(seed, authenticatorAddr, authConfig, hookAddr, hookData),
      'create wallet with hook',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { mnemonic },
        factoryAddress: this.config.addresses.factory,
        authenticatorAddr
      }
    );
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
   * @param {String} [options.authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   * @throws {ValidationError} If authConfig is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async createWalletCore(options = {}) {
    const { authConfig } = options;
    requireBytes(authConfig, 'authConfig');

    const authenticatorAddr = this._resolveAuthenticator(options.authenticatorAddr);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      () => factory.createWalletCore(seed, authenticatorAddr, authConfig),
      'create wallet core',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { mnemonic },
        factoryAddress: this.config.addresses.factory,
        authenticatorAddr
      }
    );
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
   * - Custom logic wallets are NOT affected by admin beacon updates
   * - Each wallet gets its own independent clone
   * 
   * @param {Object} options - Wallet creation options
   * @param {String} [options.authenticatorAddr] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @param {String} options.customLogicImplAddr - Custom logic implementation contract address (must implement IWalletLogic)
   * @param {Bytes} options.logicData - Initialization data for your custom logic
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async createWalletWithCustomLogic(options = {}) {
    const { authConfig, customLogicImplAddr, logicData } = options;
    requireBytes(authConfig, 'authConfig');
    requireAddress(customLogicImplAddr, 'customLogicImplAddr');
    requireBytes(logicData, 'logicData');

    const authenticatorAddr = this._resolveAuthenticator(options.authenticatorAddr);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      () => factory.createWalletWithCustomLogic(seed, authenticatorAddr, authConfig, customLogicImplAddr, logicData),
      'create wallet with custom logic',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { mnemonic },
        factoryAddress: this.config.addresses.factory,
        authenticatorAddr
      }
    );
  }

  /**
   * Update the WalletLogic implementation for all wallets (Admin function)
   * 
   * This updates the orchestration layer, not the key security.
   * 
   * @param {Object} options - Update logic options
   * @param {String} options.newLogicAddr - New walletLogic contract address
   * @returns {Promise<Object>} Update logic result
   * @throws {ValidationError} If newLogicAddr is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateWalletLogicImplAddr(options = {}) {
    const { newLogicAddr } = options;
    requireAddress(newLogicAddr, 'newLogicAddr');

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      () => factory.upgradeLogic(newLogicAddr),
      'update wallet logic',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletFactoryEvents.BeaconUpgraded,
          contract: factory
        }],
        factoryAddress: this.config.addresses.factory
      }
    );
  }

  /**
   * Transfer admin ownership role to a new address (Admin function)
   * 
   * @param {Object} options - Transfer admin options
   * @param {String} options.newAdminAddr - New admin address
   * @returns {Promise<Object>} Transfer admin result
   * @throws {ValidationError} If newAdminAddr is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async transferAdmin(options = {}) {
    const { newAdminAddr } = options;
    requireAddress(newAdminAddr, 'newAdminAddr');

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      () => factory.transferAdmin(newAdminAddr),
      'transfer admin',
      {
        ...options,
        extraData: { newAdmin: newAdminAddr },
        factoryAddress: this.config.addresses.factory
      }
    );
  }

}

export default WalletFactoryClient;
