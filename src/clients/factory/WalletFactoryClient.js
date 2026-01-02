/**
 * WalletFactoryClient
 * 
 * Client for interacting with WalletFactory contract methods.
 * Handles wallet creation and factory administration.
 */

// Internal base classes
import BaseContractClient from '../../base/BaseContractClient.js';

// Internal contracts
import { getWalletFactoryContract } from '../../contracts/core/walletFactory.js';

// Internal events
import { WalletFactoryEvents } from '../../events/index.js';

// Internal utilities
import { generateMnemonic, deriveSeed } from '../../crypto/wallet.js';
import { requireAddress, requireBytes } from '../../internal/assert.js';

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
   * Resolve authenticator address with default fallback
   * 
   * Standardizes default parameter handling for authenticator addresses.
   * If no authenticator is provided, defaults to PasswordAuthenticator.
   * 
   * @private
   * @param {String} [authenticator] - Optional authenticator address
   * @returns {String} Authenticator address (provided or default)
   */
  _resolveAuthenticator(authenticator) {
    return authenticator || this.config.addresses.passwordAuth;
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Check if an address is a wallet created by this factory
   * 
   * @param {Object} options - Is wallet options
   * @param {String} options.walletAddress - Wallet address to check
   * @returns {Promise<Boolean>} True if address is a wallet created by this factory, false otherwise
   * @throws {ValidationError} If walletAddress is missing or invalid
   */
  async isWallet(options = {}) {
    const { walletAddress } = options;
    requireAddress(walletAddress, 'walletAddress');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      () => factory.isWallet(walletAddress),
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
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
   * @throws {ValidationError} If walletAddress is missing or invalid
   */
  async getWalletKeyVault(options = {}) {
    const { walletAddress } = options;
    requireAddress(walletAddress, 'walletAddress');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      () => factory.walletKeyVault(walletAddress),
      'get wallet key vault',
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
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} Storage contract address
   * @throws {ValidationError} If walletAddress is missing or invalid
   */
  async getStorageAddr(options = {}) {
    const { walletAddress } = options;
    requireAddress(walletAddress, 'walletAddress');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      () => factory.walletStorage(walletAddress),
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
   * The beacon controlling WalletLogic upgrades
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
   *      2. KeyVault (auth + signing, user-upgradeable)
   *      3. WalletLogic proxy (orchestration, admin-upgradeable)
   * 
   * @param {Object} options - Wallet creation options
   * @param {String} [options.authenticator] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   * @throws {ValidationError} If authConfig is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   * 
   * @example
   * const result = await sdk.factory.createWallet({
   *   authConfig: passwordHash
   * });
   * console.log('Wallet created:', result.wallet);
   * console.log('Mnemonic:', result.mnemonic); // Save this securely!
   */
  async createWallet(options = {}) {
    const { authConfig } = options;
    requireBytes(authConfig, 'authConfig');

    const authenticator = this._resolveAuthenticator(options.authenticator);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      () => factory.createWallet(seed, authenticator, authConfig),
      'create wallet',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { mnemonic },
        factoryAddress: this.config.addresses.factory,
        authenticator
      }
    );
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
   * @param {String} [options.authenticator] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {String} options.hook - Hook contract address
   * @param {Bytes} options.hookData - Data for the hook
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async createWalletWithHook(options = {}) {
    const { authConfig, hook, hookData } = options;
    requireBytes(authConfig, 'authConfig');
    requireAddress(hook, 'hook');
    requireBytes(hookData, 'hookData');

    const authenticator = this._resolveAuthenticator(options.authenticator);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      () => factory.createWalletWithHook(seed, authenticator, authConfig, hook, hookData),
      'create wallet with hook',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { mnemonic },
        factoryAddress: this.config.addresses.factory,
        authenticator
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
   * @param {String} [options.authenticator] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
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

    const authenticator = this._resolveAuthenticator(options.authenticator);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      () => factory.createWalletCore(seed, authenticator, authConfig),
      'create wallet core',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { mnemonic },
        factoryAddress: this.config.addresses.factory,
        authenticator
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
   * - Custom logic wallets are NOT affected by admin beacon upgrades
   * - Each wallet gets its own independent clone
   * 
   * @param {Object} options - Wallet creation options
   * @param {String} [options.authenticator] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @param {String} options.customLogicImpl - Custom logic implementation contract address (must implement IWalletLogic)
   * @param {Bytes} options.logicData - Initialization data for your custom logic
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async createWalletWithCustomLogic(options = {}) {
    const { authConfig, customLogicImpl, logicData } = options;
    requireBytes(authConfig, 'authConfig');
    requireAddress(customLogicImpl, 'customLogicImpl');
    requireBytes(logicData, 'logicData');

    const authenticator = this._resolveAuthenticator(options.authenticator);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      () => factory.createWalletWithCustomLogic(seed, authenticator, authConfig, customLogicImpl, logicData),
      'create wallet with custom logic',
      {
        ...options,
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { mnemonic },
        factoryAddress: this.config.addresses.factory,
        authenticator
      }
    );
  }

  /**
   * Upgrade the WalletLogic implementation for all wallets (Admin function)
   * 
   * This upgrades the orchestration layer, not the key security.
   * 
   * @param {Object} options - Upgrade logic options
   * @param {String} options.newLogicAddress - New walletLogic contract address
   * @returns {Promise<Object>} Upgrade logic result
   * @throws {ValidationError} If newLogicAddress is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async upgradeWalletLogicImplAddr(options = {}) {
    const { newLogicAddress } = options;
    requireAddress(newLogicAddress, 'newLogicAddress');

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      () => factory.upgradeLogic(newLogicAddress),
      'upgrade wallet logic',
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
   * @param {String} options.newAdminAddress - New admin address
   * @returns {Promise<Object>} Transfer admin result
   * @throws {ValidationError} If newAdminAddress is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async transferAdmin(options = {}) {
    const { newAdminAddress } = options;
    requireAddress(newAdminAddress, 'newAdminAddress');

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      () => factory.transferAdmin(newAdminAddress),
      'transfer admin',
      {
        ...options,
        extraData: { newAdmin: newAdminAddress },
        factoryAddress: this.config.addresses.factory
      }
    );
  }

}

export default WalletFactoryClient;
