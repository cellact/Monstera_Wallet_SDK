/**
 * WalletFactoryClient
 *
 * Client for interacting with WalletFactory contract methods.
 * Handles wallet creation and factory administration.
 *
 * Creation methods expect {@link EncodedAuthConfigOptions}: hex-encoded {@code authConfig}
 * for the factory contract (output of built-in encoders, {@code AuthConfigBuilder.prototype.encode}, manual encoding, or custom authenticators).
 * Monstera create-wallet APIs accept structured configs and encode before calling these methods.
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').WalletCreationResult} WalletCreationResult
 * @typedef {import('../../types/index.js').TransferAdminResult} TransferAdminResult
 * @typedef {import('../../types/index.js').UpdateWalletLogicImplAddrResult} UpdateWalletLogicImplAddrResult
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Mnemonic} Mnemonic
 * @typedef {import('../../types/index.js').EncodedAuthConfigOptions} EncodedAuthConfigOptions
 * @typedef {import('../../types/index.js').FactoryClientCreateWalletBaseOptions} FactoryClientCreateWalletBaseOptions
 * @typedef {import('../../types/index.js').FactoryClientCreateWalletFromMnemonicOptions} FactoryClientCreateWalletFromMnemonicOptions
 * @typedef {import('../../types/index.js').FactoryClientCreateWalletWithHookOptions} FactoryClientCreateWalletWithHookOptions
 * @typedef {import('../../types/index.js').FactoryClientCreateWalletWithCustomLogicOptions} FactoryClientCreateWalletWithCustomLogicOptions
 * @typedef {import('../../types/index.js').WalletProxyOptions} WalletProxyOptions
 * @typedef {import('../../types/index.js').UpdateWalletLogicImplOptions} UpdateWalletLogicImplOptions
 * @typedef {import('../../types/index.js').TransferAdminOptions} TransferAdminOptions
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getWalletFactoryContract } from '../../contracts/core/walletFactory.js';
import { WalletFactoryEvents } from '../../events/index.js';
import { generateMnemonic, deriveSeed } from '../../internal/crypto/index.js';
import { requireAddress, requireBytes, requireMnemonic, requireNonEmptyBytes } from '../../internal/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

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
   * @remarks
   * The mnemonic string stays reachable while {@link BaseContractClient#executeWrite} runs (submit tx, wait for receipt, parse events).
   * Callers attach it to the result via {@code extraData} so integrators can back up the phrase — intentional, not accidental exposure through the pipeline.
   * JavaScript cannot reliably zero-fill string secrets; minimizing retention is limited to not holding the result longer than necessary.
   */
  _prepareWalletCreation() {
    // Off-chain: Generate mnemonic
    const mnemonic = generateMnemonic();
    
    // Off-chain: Derive seed from mnemonic
    const seed = deriveSeed(mnemonic);
    
    return { mnemonic, seed };
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Check if an address is a wallet created by this factory
   * 
   * @param {WalletProxyOptions} options - Is wallet options
   * @returns {Promise<boolean>} True if address is a wallet created by this factory, false otherwise
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async isWallet(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: isWallet');
    log.debug('Checking if address is a wallet created by this factory', sanitizer.forLog(options));

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
   * @param {WalletProxyOptions} options - KeyVault options
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getKeyVaultAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: getKeyVaultAddr');
    log.debug('Getting keyVault address for wallet', sanitizer.forLog(options));

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
   * @param {WalletProxyOptions} options - Storage options
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getStorageAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: getStorageAddr');
    log.debug('Getting storage address for wallet', sanitizer.forLog(options));

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
   * @param {WalletProxyOptions} options - SecretVault options
   * @returns {Promise<Address>} SecretVault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getSecretVaultAddr(options = {}) {
    const { walletAddr } = options;
    requireAddress(walletAddr, 'walletAddr');
    log.info('WalletFactory: getSecretVaultAddr');
    log.debug('Getting secretVault address for wallet', sanitizer.forLog(options));

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
   * @param {FactoryClientCreateWalletBaseOptions} options - Wallet creation options ({@code authConfig} must be encoded)
   * @returns {Promise<WalletCreationResult>}
   * @throws {ValidationError} If authConfig is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   *
   * @remarks
   * {@link WalletCreationResult.mnemonic} is the generated phrase, returned on purpose for backup (see {@link WalletCreationResult}).
   * It exists in memory until this write settles and while the caller retains the result; handle and store it as a high-value secret.
   */
  async createWallet(options = {}) {
    const { authConfig } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    log.info('WalletFactory: createWallet');
    log.debug('Creating wallet', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
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
   * @param {FactoryClientCreateWalletFromMnemonicOptions} options - Wallet creation options ({@code authConfig} must be encoded)
   * @returns {Promise<WalletCreationResult>}
   * @throws {ValidationError} If authConfig is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   *
   * @remarks
   * {@link WalletCreationResult.mnemonic} echoes the caller-supplied phrase for a uniform result shape (same security expectations as {@link WalletFactoryClient#createWallet}).
   */
  async createWalletFromMnemonic(options = {}) {
    const { authConfig, mnemonic } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    requireMnemonic(mnemonic, 'mnemonic');
    log.info('WalletFactory: createWalletFromMnemonic');
    log.debug('Creating wallet from mnemonic', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
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
   * @param {FactoryClientCreateWalletWithHookOptions} options - Wallet creation options ({@code authConfig} must be encoded)
   * @returns {Promise<WalletCreationResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   *
   * @remarks
   * Mnemonic handling: see {@link WalletFactoryClient#createWallet}.
   */
  async createWalletWithHook(options = {}) {
    const { authConfig, hookAddr, hookData } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    requireAddress(hookAddr, 'hookAddr');
    requireBytes(hookData, 'hookData');
    log.info('WalletFactory: createWalletWithHook');
    log.debug('Creating wallet with post-creation hook', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
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
   * @remarks
   * The returned {@link WalletCreationResult} is parsed from the same {@code WalletCreated} event as full wallet creation.
   * For this core-only path the factory records the KeyVault address as both {@code wallet} and {@code keyVault};
   * identical values are intentional (KeyVault is the wallet address here), not an event-parsing mistake.
   * Mnemonic in the result: see {@link WalletFactoryClient#createWallet}.
   *
   * @param {FactoryClientCreateWalletBaseOptions} options - Wallet creation options ({@code authConfig} must be encoded)
   * @returns {Promise<WalletCreationResult>}
   * @throws {ValidationError} If authConfig is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async createWalletCore(options = {}) {
    const { authConfig } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    log.info('WalletFactory: createWalletCore');
    log.debug('Creating wallet core (storage + keyVault only)', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
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
   * @param {FactoryClientCreateWalletWithCustomLogicOptions} options - Wallet creation options ({@code authConfig} must be encoded)
   * @returns {Promise<WalletCreationResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   *
   * @remarks
   * Mnemonic handling: see {@link WalletFactoryClient#createWallet}.
   */
  async createWalletWithCustomLogic(options = {}) {
    const { authConfig, customLogicImplAddr, logicData } = options;
    requireNonEmptyBytes(authConfig, 'authConfig');
    requireAddress(customLogicImplAddr, 'customLogicImplAddr');
    requireNonEmptyBytes(logicData, 'logicData');
    log.info('WalletFactory: createWalletWithCustomLogic');
    log.debug('Creating wallet with custom logic implementation', sanitizer.forLog(options));

    const authenticatorAddr = options.authenticatorAddr ?? this.config.addresses.passwordAuth;
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
   * @param {UpdateWalletLogicImplOptions} options - Update logic options
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
    log.debug('Updating wallet logic implementation address', sanitizer.forLog(options));
    
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
   * @param {TransferAdminOptions} options - Transfer admin options
   * @returns {Promise<TransferAdminResult>}
   * @throws {ValidationError} If newAdminAddr is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async transferAdmin(options = {}) {
    const { newAdminAddr } = options;
    requireAddress(newAdminAddr, 'newAdminAddr');
    log.info('WalletFactory: transferAdmin');
    log.debug('Transferring admin to new address', sanitizer.forLog(options));

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
