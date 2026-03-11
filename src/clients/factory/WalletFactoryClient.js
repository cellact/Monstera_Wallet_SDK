/**
 * WalletFactoryClient
 * 
 * Client for interacting with WalletFactory contract methods.
 * Handles wallet creation and factory administration.
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').WalletCreationResult} WalletCreationResult
 * @typedef {import('../../types/index.js').CreateWalletWithHookOptions} CreateWalletWithHookOptions
 * @typedef {import('../../types/index.js').CreateWalletWithCustomLogicOptions} CreateWalletWithCustomLogicOptions
 * @typedef {import('../../types/index.js').TransferAdminResult} TransferAdminResult
 * @typedef {import('../../types/index.js').UpdateWalletLogicImplAddrResult} UpdateWalletLogicImplAddrResult
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Mnemonic} Mnemonic
 * @typedef {import('../../types/index.js').CreateWalletBaseOptions} CreateWalletBaseOptions
 * @typedef {import('../../types/index.js').CreateWalletFromMnemonicOptions} CreateWalletFromMnemonicOptions
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getWalletFactoryContract } from '../../contracts/core/walletFactory.js';
import { WalletFactoryEvents } from '../../events/index.js';
import { generateMnemonic, deriveSeed } from '../../crypto/wallet.js';
import { requireAddress, requireBytes, requireMnemonic } from '../../internal/assert.js';
import log from '../../internal/logger.js';

class WalletFactoryClient extends BaseContractClient {
  // ============================================================================
  // Constructor
  // ============================================================================
  
  /**
   * @param {EthersProvider} readProvider - Ethers provider for read operations
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped signer for write operations (null for read-only clients)
   * @param {NetworkConfig} config - Configuration object
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
   * @returns {{ mnemonic: Mnemonic; seed: Bytes }} Object containing generated mnemonic and derived seed
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
   * @param {Address} [authenticatorAddr] - Optional authenticator contract address
   * @returns {Address} Authenticator address (provided or default)
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
   * @param {Record<string, unknown>} options - Is wallet options
   * @param {Address} options.walletAddr - Wallet address to check
   * @returns {Promise<boolean>} True if address is a wallet created by this factory, false otherwise
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async isWallet(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: isWallet');
    log.debug('Checking if address is a wallet created by this factory', { walletAddr });

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.isWallet(walletAddr),
        methodName: 'check if address is wallet',
        ...options
      }
    );
  }

  /**
   * Get the admin address
   * 
   * @param {Record<string, unknown>} [options={}] - Options object
   * @returns {Promise<Address>} Admin address
   */
  async getAdmin(options = {}) {
    log.info('WalletFactory: getAdmin');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.admin(),
        methodName: 'get admin',
        ...options
      }
    );
  }

  /**
   * Get current WalletLogic implementation (current walletLogic contract address)
   * 
   * @param {Record<string, unknown>} [options={}] - Options object
   * @returns {Promise<Address>} Current WalletLogic implementation
   */
  async getWalletLogicImplAddr(options = {}) {
    log.info('WalletFactory: getWalletLogicImplAddr');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.implementation(),
        methodName: 'get wallet logic implementation',
        ...options
      }
    );
  }

  /**
   * Get the keyVault contract address for a wallet
   * 
   * @param {Record<string, unknown>} options - KeyVault options
   * @param {Address} options.walletAddr - Wallet proxy address (from createWallet)
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getKeyVaultAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: getKeyVaultAddr');
    log.debug('Getting keyVault address for wallet', { walletAddr });

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.walletKeyVault(walletAddr),
        methodName: 'get wallet key vault address',
        ...options
      }
    );
  }

  /**
   * Get the storage contract address for a wallet
   * 
   * @param {Record<string, unknown>} options - Storage options
   * @param {Address} options.walletAddr - Wallet proxy address (from createWallet)
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getStorageAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: getStorageAddr');
    log.debug('Getting storage address for wallet', { walletAddr });

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.walletStorage(walletAddr),
        methodName: 'get storage address',
        ...options
      }
    );
  }

  /**
   * Get the beacon address for a wallet 
   * 
   * The beacon controlling WalletLogic updates
   * 
   * @param {Record<string, unknown>} [options={}] - Options object
   * @returns {Promise<Address>} Beacon address
   */
  async getBeaconAddr(options = {}) {
    log.info('WalletFactory: getBeaconAddr');

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.beacon(),
        methodName: 'get beacon address',
        ...options
      }
    );
  }

  /**
   * Get the secretVault address mapped to a wallet
   * 
   * @param {Record<string, unknown>} options - SecretVault options
   * @param {Address} options.walletAddr - Wallet proxy address (from createWallet)
   * @returns {Promise<Address>} SecretVault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getSecretVaultAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: getSecretVaultAddr');
    log.debug('Getting secretVault address for wallet', { walletAddr });

    const factory = this.getReadContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeRead(
      {
        operation: () => factory.walletSecretVault(walletAddr),
        methodName: 'get secret vault address',
        ...options
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
   * @param {CreateWalletBaseOptions} options - Wallet creation options
   * @returns {Promise<WalletCreationResult>}
   * @throws {ValidationError} If authConfig is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   * 
   */
  async createWallet(options = {}) {
    const { authConfig } = options;
    requireBytes(authConfig, 'authConfig');
    log.info('WalletFactory: createWallet');

    const authenticatorAddr = this._resolveAuthenticator(options.authenticatorAddr);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      {
        operation: () => factory.createWallet(seed, authenticatorAddr, authConfig),
        methodName: 'create wallet',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: {
          mnemonic 
        },
        ...options
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
   * @param {CreateWalletFromMnemonicOptions} options - Wallet creation options
   * @returns {Promise<WalletCreationResult>}
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
    log.info('WalletFactory: createWalletFromMnemonic');
    log.debug('Creating wallet from mnemonic', { mnemonicLength: mnemonic.length }); // TODO: log the options leaving out sensitive data

    const authenticatorAddr = this._resolveAuthenticator(options.authenticatorAddr);
    const seed = deriveSeed(mnemonic);
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      {
        operation: () => factory.createWallet(seed, authenticatorAddr, authConfig),
        methodName: 'create wallet',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { 
          mnemonic 
        },
        ...options
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
   * @param {CreateWalletWithHookOptions} options - Wallet creation options
   * @returns {Promise<WalletCreationResult>}
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
    log.info('WalletFactory: createWalletWithHook');
    log.debug('Creating wallet with post-creation hook', { hookAddr }); // TODO: log the options leaving out sensitive data

    const authenticatorAddr = this._resolveAuthenticator(options.authenticatorAddr);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      {
        operation: () => factory.createWalletWithHook(seed, authenticatorAddr, authConfig, hookAddr, hookData),
        methodName: 'create wallet with hook',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { 
          mnemonic 
        },
        ...options
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
   * @param {CreateWalletBaseOptions} options - Wallet creation options
   * @returns {Promise<WalletCreationResult>} 
   * @throws {ValidationError} If authConfig is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async createWalletCore(options = {}) {
    const { authConfig } = options;
    requireBytes(authConfig, 'authConfig');
    log.info('WalletFactory: createWalletCore');
    log.debug('Creating wallet core (storage + keyVault only)', { authConfigLength: authConfig.length }); // TODO: log the options leaving out sensitive data

    const authenticatorAddr = this._resolveAuthenticator(options.authenticatorAddr);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);
    
    return this.executeWrite(
      {
        operation: () => factory.createWalletCore(seed, authenticatorAddr, authConfig),
        methodName: 'create wallet core',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { 
          mnemonic
        },
        ...options
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
   * @param {CreateWalletWithCustomLogicOptions} options - Wallet creation options
   * @returns {Promise<WalletCreationResult>}
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
    log.info('WalletFactory: createWalletWithCustomLogic');
    log.debug('Creating wallet with custom logic implementation', { customLogicImplAddr }); // TODO: log the options leaving out sensitive data

    const authenticatorAddr = this._resolveAuthenticator(options.authenticatorAddr);
    const { mnemonic, seed } = this._prepareWalletCreation();
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite( 
      {
        operation: () => factory.createWalletWithCustomLogic(seed, authenticatorAddr, authConfig, customLogicImplAddr, logicData),
        methodName: 'create wallet with custom logic',
        parseEvents: [{
          eventDef: WalletFactoryEvents.WalletCreated,
          contract: factory
        }],
        extraData: { 
          mnemonic
        },
        ...options
      }
    );
  }

  /**
   * Update the WalletLogic implementation for all wallets (Admin function)
   * 
   * This updates the orchestration layer, not the key security.
   * 
   * @param {Record<string, unknown>} options - Update logic options
   * @param {Address} options.newLogicAddr - New walletLogic contract address
   * @returns {Promise<UpdateWalletLogicImplAddrResult>}
   * @throws {ValidationError} If newLogicAddr is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateWalletLogicImplAddr(options = {}) {
    const { newLogicAddr } = options;
    requireAddress(newLogicAddr, 'newLogicAddr');
    log.info('WalletFactory: updateWalletLogicImplAddr');
    log.debug('Updating wallet logic implementation address', { newLogicAddr });
    
    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.upgradeLogic(newLogicAddr),
        methodName: 'update wallet logic',
        parseEvents: [{
          eventDef: WalletFactoryEvents.BeaconUpgraded,
          contract: factory
        }],
        ...options
      }
    );
  }

  /**
   * Transfer admin ownership role to a new address (Admin function)
   * 
   * @param {Record<string, unknown>} options - Transfer admin options
   * @param {Address} options.newAdminAddr - New admin address
   * @returns {Promise<TransferAdminResult>}
   * @throws {ValidationError} If newAdminAddr is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async transferAdmin(options = {}) {
    const { newAdminAddr } = options;
    requireAddress(newAdminAddr, 'newAdminAddr');
    log.info('WalletFactory: transferAdmin');
    log.debug('Transferring admin to new address', { newAdminAddr });

    const factory = this.getWriteContract(getWalletFactoryContract, this.config.addresses.factory);

    return this.executeWrite(
      {
        operation: () => factory.transferAdmin(newAdminAddr),
        methodName: 'transfer admin',
        requireEvents: false,
        extraData: { 
          newAdmin: newAdminAddr, 
          factoryAddress: this.config.addresses.factory 
        },
        ...options
      }
    );
  }

}

export default WalletFactoryClient;
