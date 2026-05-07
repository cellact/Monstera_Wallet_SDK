/**
 * Monstera Wallet SDK
 * 
 * Main SDK class for interacting with Monstera wallet contracts.
 * Provides clean API for read and write operations.
 * 
 * @typedef {import('../types/index.js').DefaultContractAddresses} DefaultContractAddresses
 * @typedef {import('../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../types/index.js').NetworkPresets} NetworkPresets
 * @typedef {import('../types/index.js').InitializeOptions} InitializeOptions
 * @typedef {import('../types/index.js').BaseTransactionResult} BaseTransactionResult
 * @typedef {import('../types/index.js').ConfigurePasswordResult} ConfigurePasswordResult
 * @typedef {import('../types/index.js').ConfigureWalletSignatureResult} ConfigureWalletSignatureResult
 * @typedef {import('../types/index.js').WalletCreationResult} WalletCreationResult
 * @typedef {import('../types/index.js').CreateWalletWithHookOptions} CreateWalletWithHookOptions
 * @typedef {import('../types/index.js').CreateWalletWithCustomLogicOptions} CreateWalletWithCustomLogicOptions
 * @typedef {import('../types/index.js').SignTransactionOptions} SignTransactionOptions
 * @typedef {import('../types/index.js').SignMessageOptions} SignMessageOptions
 * @typedef {import('../types/index.js').SignHashOptions} SignHashOptions
 * @typedef {import('../types/index.js').UpdateWalletLogicImplAddrResult} UpdateWalletLogicImplAddrResult
 * @typedef {import('../types/index.js').UpdateKeyVaultImplAddrResult} UpdateKeyVaultImplAddrResult
 * @typedef {import('../types/index.js').UpdateAuthenticatorOptions} UpdateAuthenticatorOptions
 * @typedef {import('../types/index.js').UpdateAuthenticatorAddrResult} UpdateAuthenticatorAddrResult
 * @typedef {import('../types/index.js').UpdatePasswordResult} UpdatePasswordResult
 * @typedef {import('../types/index.js').AddToWhitelistResult} AddToWhitelistResult
 * @typedef {import('../types/index.js').RemoveFromWhitelistResult} RemoveFromWhitelistResult
 * @typedef {import('../types/index.js').CreateAuthProofWalletSignatureOptions} CreateAuthProofWalletSignatureOptions
 * @typedef {import('../types/index.js').CreateAuthProofMinuteSignatureOptions} CreateAuthProofMinuteSignatureOptions
 * @typedef {import('../types/index.js').CreateAuthProofMinuteSignatureResult} CreateAuthProofMinuteSignatureResult
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').Bytes} Bytes
 * @typedef {import('../types/index.js').Bytes32} Bytes32
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../types/index.js').AuthenticatorClientInstance} AuthenticatorClientInstance
 * @typedef {import('../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 * @typedef {import('../types/index.js').CreateWalletBaseOptions} CreateWalletBaseOptions
 * @typedef {import('../types/index.js').CreateWalletFromMnemonicOptions} CreateWalletFromMnemonicOptions
 * @typedef {import('../types/index.js').ConfigurePasswordDualFactorResult} ConfigurePasswordDualFactorResult
 * @typedef {import('../types/index.js').UpdateGuardianResult} UpdateGuardianResult
 * @typedef {import('../types/index.js').TransferAdminResult} TransferAdminResult
 * @typedef {import('../types/index.js').KeyMetadataResult} KeyMetadataResult
 * @typedef {import('../types/index.js').SignWithImportedKeyOptions} SignWithImportedKeyOptions
 * @typedef {import('../types/index.js').SignSolanaOptions} SignSolanaOptions
 * @typedef {import('../types/index.js').ImportKeyOptions} ImportKeyOptions
 * @typedef {import('../types/index.js').SetChainBaseKeysOptions} SetChainBaseKeysOptions
 * @typedef {import('../types/index.js').CreateAuthProofDualFactorOptions} CreateAuthProofDualFactorOptions
 * @typedef {import('../types/index.js').ChainId} ChainId
 * @typedef {import('../types/index.js').ExecuteWithAuthOptions} ExecuteWithAuthOptions
 * @typedef {import('../types/index.js').InitializeWalletLogicOptions} InitializeWalletLogicOptions
 * @typedef {import('../types/index.js').KeyVaultAccountSliceOptions} KeyVaultAccountSliceOptions
 * @typedef {import('../types/index.js').KeyVaultAddrIndexOptions} KeyVaultAddrIndexOptions
 * @typedef {import('../types/index.js').KeyVaultAddrOptions} KeyVaultAddrOptions
 * @typedef {import('../types/index.js').KeyVaultImportedKeyOptions} KeyVaultImportedKeyOptions
 * @typedef {import('../types/index.js').AddWhitelistOptions} AddWhitelistOptions
 * @typedef {import('../types/index.js').ConfigureDualFactorOptions} ConfigureDualFactorOptions
 * @typedef {import('../types/index.js').ConfigurePasswordOptions} ConfigurePasswordOptions
 * @typedef {import('../types/index.js').ConfigurePasswordMinuteOptions} ConfigurePasswordMinuteOptions
 * @typedef {import('../types/index.js').ConfigureWalletSignatureOptions} ConfigureWalletSignatureOptions
 * @typedef {import('../types/index.js').DeactivateActivateKeyOptions} DeactivateActivateKeyOptions
 * @typedef {import('../types/index.js').RemoveWhitelistOptions} RemoveWhitelistOptions
 * @typedef {import('../types/index.js').TransferAdminOptions} TransferAdminOptions
 * @typedef {import('../types/index.js').UpdateGuardianOptions} UpdateGuardianOptions
 * @typedef {import('../types/index.js').UpdateKeyVaultImplOptions} UpdateKeyVaultImplOptions
 * @typedef {import('../types/index.js').UpdatePasswordDualFactorOptions} UpdatePasswordDualFactorOptions
 * @typedef {import('../types/index.js').UpdatePasswordOptions} UpdatePasswordOptions
 * @typedef {import('../types/index.js').UpdateWalletLogicImplOptions} UpdateWalletLogicImplOptions
 * @typedef {import('../types/index.js').VerifyPasswordOptions} VerifyPasswordOptions
 * @typedef {import('../types/index.js').WhitelistCheckOptions} WhitelistCheckOptions
 * @typedef {import('../types/index.js').WalletProxyOptions} WalletProxyOptions
 * @typedef {import('../types/index.js').ImportKeyResult} ImportKeyResult
 * @typedef {import('../types/index.js').DeactivateKeyResult} DeactivateKeyResult
 * @typedef {import('../types/index.js').ActivateKeyResult} ActivateKeyResult
 * @typedef {import('../types/index.js').RequiredContractAddressKeys} RequiredContractAddressKeys
 * @typedef {import('../types/index.js').EncodedAuthProofWalletSignature} EncodedAuthProofWalletSignature
 * @typedef {import('../types/index.js').EncodedAuthProofDualFactor} EncodedAuthProofDualFactor
 * @typedef {import('../types/index.js').SignAuthorizationOptions} SignAuthorizationOptions
 * @typedef {import('../types/index.js').SignedAuthorizationResult} SignedAuthorizationResult
 * @typedef {import('../types/index.js').ConnectOptions} ConnectOptions
 */

import MonsteraConfig from '../config/monstera.js';
import MonsteraUtils from './MonsteraUtils.js';
import log from '../internal/logger.js';
import WalletFactoryClient from '../clients/factory/index.js';
import WalletLogicClient from '../clients/logic/index.js';
import KeyVaultClient from '../clients/keyVault/index.js';
import { AuthenticatorClient } from '../clients/auth/index.js';
import {
  createAuthProofWalletSignature,
  createAuthProofMinuteSignature,
  createAuthProofDualFactor,
  createWalletSigAuthConfig,
  createDualFactorAuthConfig
} from '../internal/crypto/index.js';
import { executeSignAuthorization } from '../internal/crypto/signAuthorization.js';
import { createProvider, createWriteSigner } from '../providers/sapphire.js';
import { assertValidResolvedConfig } from '../internal/validators/networkConfig.js';
import { AuthConfigBuilder } from '../internal/auth/config/AuthConfigBuilder.js';
import { AuthProofBuilder } from '../internal/auth/proof/AuthProofBuilder.js';
import {
  withWalletSignatureProofDefaults,
  withMinuteSignatureProofDefaults,
  withDualFactorProofDefaults
} from '../internal/auth/defaults/authProofDefaults.js';

/**
 * Monstera Wallet SDK
 *
 * Main entry point for wallet operations on Oasis Sapphire.
 *
 * @remarks
 * Top-level methods prefer {@link KeyVaultClient} (`keyVaultAddr`): signing, account queries, upgrades, and imports
 * mirror what WalletLogic ultimately forwards to KeyVault, so calling KeyVault directly is simpler and matches most docs.
 * {@link WalletLogicClient} remains available as {@link Monstera#logic} for wallet-proxy-shaped calls (`walletAddr`), e.g.
 * {@link Monstera#initializeWalletLogic} or advanced use when you must hit the WalletLogic contract explicitly.
 */
class Monstera {
  // ============================================================================
  // Constructor
  // ============================================================================

  /**
   * @param {MonsteraConfigOptions} config - SDK configuration
   */
  constructor(config) {
    assertValidResolvedConfig(config);
    this.config = config;
    this.version = MonsteraConfig.version;

    // Initialize read provider (for read operations)
    this.readProvider = config.provider ?? createProvider(config.rpcUrl, 'read');
    
    // Initialize write signer (for write operations with Sapphire wrapper)
    this.writeSigner = config.signer ? createWriteSigner(config.signer, config.rpcUrl, 'write') : null;

    // Wire domain clients
    this.factory = new WalletFactoryClient(this.readProvider, this.writeSigner, config);
    this.logic = new WalletLogicClient(this.readProvider, this.writeSigner, config);
    this.keyVault = new KeyVaultClient(this.readProvider, this.writeSigner, config);
    this.auth = new AuthenticatorClient(this.readProvider, this.writeSigner, config);

    this._authProofBuilder = new AuthProofBuilder({
      addresses: config.addresses,
      chainId: config.chainId,
      readProvider: this.readProvider,
      getAuthenticatorAddr: (keyVaultAddr) => this.getAuthenticatorAddr({ keyVaultAddr })
    });
    this._authConfigBuilder = new AuthConfigBuilder({ addresses: config.addresses });

    // Check version in background only when explicitly enabled.
    if (config?.checkVersion === true && !MonsteraUtils.versionCheckDone) {
      MonsteraUtils.checkVersionOnce(this.version);
    }
  }

  // ============================================================================
  // Static methods
  // ============================================================================

  /**
   * Connect to Monstera on a given network (read by default, write when a signer is provided)
   *
   * Without a truthy `signer`, creates a read-only client (optional `provider`, else RPC from config).
   * With a `signer`, creates a write-capable client.
   *
   * @param {ConnectOptions} options - Connect options
   * @returns {Monstera} SDK instance
   */
  static connect(options) {
    const logLevel = options?.logLevel ?? (options?.debug === true ? 'debug' : 'error');
    log.setLevel(logLevel);

    const base = MonsteraConfig.resolveBaseConfig(options);

    const provider = options?.provider ?? null;

    const signer = options?.signer;
    if (signer) {
      return new Monstera({
        ...base,
        signer,
        provider,
        checkVersion: options?.checkVersion,
        logLevel
      });
    }

    return new Monstera({
      ...base,
      provider,
      signer: null,
      checkVersion: options?.checkVersion,
      logLevel
    });
  }

  /**
   * Set the SDK log level. Affects the shared logger used by all Monstera code.
   *
   * @param {'error' | 'warn' | 'info' | 'debug'} level - Minimum level to emit (error < warn < info < debug)
   */
  setLogLevel(level) {
    log.setLevel(level);
  }

  // ============================================================================
  // Static Properties (Class-Level Constants)
  // ============================================================================

  /**
   * Version of the SDK
   * @static
   * @readonly
   * @returns {string} SDK version string
   */
  static get version() {
    return MonsteraConfig.version;
  }
  
  /**
   * Network presets for testnet and mainnet
   * @static
   * @readonly
   * @returns {NetworkPresets} Network configuration presets
   */
  static get networks() {
    return MonsteraConfig.networks;
  }

  /**
   * Built-in contract address defaults shipped with the SDK (no network I/O).
   *
   * @static
   * @readonly
   * @returns {DefaultContractAddresses} Static defaults by network
   */
  static get defaultAddresses() {
    return MonsteraConfig.defaultAddresses;
  }

  /**
   * Required contract addresses for the SDK to function
   * @static
   * @readonly
   * @returns {RequiredContractAddressKeys} Ordered list of required {@link ContractAddresses} keys
   */
  static get requiredAddresses() {
    return MonsteraConfig.requiredAddresses;
  }

  // ============================================================================
  // Instance Properties (Convenience Getters)
  // ============================================================================

  /**
   * Network name for the configured network
   * @readonly
   * @returns {string} Network name
   */
  get network() { return this.config.network; }

  /**
   * Chain ID for the configured network
   * @readonly
   * @returns {ChainId} Chain ID
   */
  get chainId() { return this.config.chainId; }

  /**
   * RPC URL for the configured network
   * @readonly
   * @returns {string} RPC URL
   */
  get rpcUrl() { return this.config.rpcUrl; }

  /**
   * Contract addresses for the configured network
   * @readonly
   * @returns {ContractAddresses} Contract addresses
   */
  get addresses() { return this.config.addresses; }

  /**
   * Provider instance (if provided)
   * @readonly
   * @returns {EthersProvider|null} Provider instance or null
   */
  get provider() { return this.config.provider; }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if SDK instance can perform write operations
   * @returns {boolean}
   */
  hasWriteAccess() {
    return this.writeSigner !== null;
  }

  /**
   * Get the signer address (if available)
   * @returns {Promise<Address|null>}
   */
  async getSignerAddr() {
    if (!this.writeSigner) return null;
    return await this.writeSigner.getAddress();
  }

  /**
   * Get a specific authenticator client by type
   * 
   * @param {string} type - Authenticator type ('walletSignature', 'password', etc.)
   * @returns {AuthenticatorClientInstance} Authenticator client instance
   * @throws {ValidationError} If authenticator type is not found
   */
  getAuthClient(type) {
    return this.auth.getClient(type);
  }

  /**
   * Get all registered authenticator types
   * 
   * @returns {string[]} Array of authenticator type names
   */
  getAvailableAuthTypes() {
    return this.auth.getAvailableTypes();
  }

  /**
   * Build {@code authProof} for WalletSignatureAuthenticator
   *
   * @param {CreateAuthProofWalletSignatureOptions} options
   * @returns {Promise<EncodedAuthProofWalletSignature>} encoded auth proof 
   */
  async createAuthProofWalletSignature(options = {}) {
    const resolved = withWalletSignatureProofDefaults(this.config, options);
    return createAuthProofWalletSignature(resolved);
  }

  /**
   * Build {@code authProof} for PasswordMinuteSignatureAuthenticator
   *
   * @param {CreateAuthProofMinuteSignatureOptions} options
   * @returns {Promise<CreateAuthProofMinuteSignatureResult>}
   * @throws {ValidationError} If addresses or passwordHash are invalid
   */
  async createAuthProofMinuteSignature(options = {}) {
    const resolved = withMinuteSignatureProofDefaults(this.config, options);
    return createAuthProofMinuteSignature({
      provider: this.readProvider,
      ...resolved
    });
  }

  /**
   * Build {@code authProof} for DualFactorAuthenticator
   * 
   * @param {CreateAuthProofDualFactorOptions} options
   * @returns {Promise<EncodedAuthProofDualFactor>} encoded auth proof 
   * @throws {ValidationError} If addresses or passwordHash are invalid
   */
  async createAuthProofDualFactor(options = {}) {
    const resolved = withDualFactorProofDefaults(this.config, options);
    return createAuthProofDualFactor({
      provider: this.readProvider,
      ...resolved
    });
  }

  // ============================================================================
  // Initialize Methods (Write)
  // ============================================================================

  /**
   * Initialize a KeyVault contract
   * 
   * @param {InitializeOptions} options - Initialize key vault options
   * @returns {Promise<BaseTransactionResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async initialize(options = {}) {
    return this.keyVault.initialize(options);
  }

  /**
   * Initialize a wallet logic with a new keyVault 
   * 
   * @param {InitializeWalletLogicOptions} options
   * @returns {Promise<BaseTransactionResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async initializeWalletLogic(options = {}) {
    return this.logic.initialize(options);
  }

  // ============================================================================
  // Configure Methods (Write)
  // ============================================================================

  /**
   * Configure password
   * 
   * @param {ConfigurePasswordOptions} options
   * @returns {Promise<ConfigurePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configurePassword(options = {}) {
    const { keyVaultAddr, passwordHash } = options;

    const authConfig = passwordHash;

    return this.auth.password.configure({ keyVaultAddr, authConfig });
  }

  /**
   * Configure the wallet signature authenticator
   * 
   * @param {ConfigureWalletSignatureOptions} options
   * @returns {Promise<ConfigureWalletSignatureResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configureWalletSignature(options = {}) {
    const { keyVaultAddr, initialWhitelist } = options;

    const authConfig = createWalletSigAuthConfig(initialWhitelist);

    return this.auth.walletSignature.configure({ keyVaultAddr, authConfig });
  }

  /**
   * Configure password dual factor
   * 
   * @param {ConfigureDualFactorOptions} options
   * @returns {Promise<ConfigurePasswordDualFactorResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configureDualFactor(options = {}) {
    const { keyVaultAddr, passwordHash, guardianAddr } = options;

    const authConfig = createDualFactorAuthConfig(passwordHash, guardianAddr);

    return this.auth.dualFactor.configure({ keyVaultAddr, authConfig });
  }

  /**
   * Configure password minute signature
   * 
   * @param {ConfigurePasswordMinuteOptions} options
   * @returns {Promise<ConfigurePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configurePasswordMinuteSignature(options = {}) {
    const { keyVaultAddr, passwordHash } = options;

    const authConfig = passwordHash;

    return this.auth.passwordMinuteSignature.configure({ keyVaultAddr, authConfig });
  }

  // ============================================================================
  // Create Methods (Write)
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
   */
  async createWallet(options = {}) {
    return this.factory.createWallet(
      this._authConfigBuilder.encode(options)
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
   */
  async createWalletFromMnemonic(options = {}) {
    return this.factory.createWalletFromMnemonic(
      this._authConfigBuilder.encode(options)
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
    return this.factory.createWalletWithHook(
      this._authConfigBuilder.encode(options)
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
   * See {@link WalletFactoryClient#createWalletCore}: {@code wallet} and {@code keyVault} in the result are the same address for this flow.
   *
   * @param {CreateWalletBaseOptions} options - Wallet creation options
   * @returns {Promise<WalletCreationResult>}
   * @throws {ValidationError} If authConfig is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async createWalletCore(options = {}) {
    return this.factory.createWalletCore(
      this._authConfigBuilder.encode(options)
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
    return this.factory.createWalletWithCustomLogic(
      this._authConfigBuilder.encode(options)
    );
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  // --- Factory Reads ---

  /**
   * Check if an address is a wallet created by this factory
   * 
   * @param {WalletProxyOptions} options
   * @returns {Promise<boolean>} True if address is a wallet created by this factory, false otherwise
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async isWallet(options = {}) {
    return this.factory.isWallet(options);
  }

  /**
   * Get the admin address
   * 
   * @param {Record<string, unknown>} [options={}] - Options object
   * @returns {Promise<Address>} Admin address
   */
  async getAdmin(options = {}) {
    return this.factory.getAdmin(options);
  }

  /**
   * Get current WalletLogic implementation (current walletLogic contract address)
   * 
   * @param {Record<string, unknown>} [options={}] - Options object
   * @returns {Promise<Address>} Current WalletLogic implementation
   */
  async getWalletLogicImplAddr(options = {}) {
    return this.factory.getWalletLogicImplAddr(options);
  }

  /**
   * Get the keyVault contract address for a wallet
   * 
   * @param {WalletProxyOptions} options
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getKeyVaultAddr(options = {}) {
    return this.factory.getKeyVaultAddr(options);
  }

  /**
   * Get the storage contract address for a wallet
   * 
   * @param {WalletProxyOptions} options
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getStorageAddr(options = {}) {
    return this.factory.getStorageAddr(options);
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
    return this.factory.getBeaconAddr(options);
  }

  /**
   * Get the secret vault address for a wallet
   * 
   * @param {WalletProxyOptions} options
   * @returns {Promise<Address>} Secret vault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getSecretVaultAddr(options = {}) {
    return this.factory.getSecretVaultAddr(options);
  }

  // --- KeyVault Reads ---

  /**
   * Get the storage contract address holding the keys
   * 
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getKeyVaultStorageAddr(options = {}) {
    return this.keyVault.getStorageAddr(options);
  }

  /**
   * Get the current authenticator contract address for a wallet 
   * 
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<Address>} Authenticator address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getAuthenticatorAddr(options = {}) {
    return this.keyVault.getAuthenticatorAddr(options);
  }

  /**
   * Get the current KeyVaultImplementation contract address
   * 
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<Address>} Implementation address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getKeyVaultImplAddr(options = {}) {
    return this.keyVault.getKeyVaultImplAddr(options);
  }

  /**
   * Check if a given keyVault is initialized 
   * 
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<boolean>} True if keyVault is initialized, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isInitialized(options = {}) {
    return this.keyVault.isInitialized(options);
  }

  /**
   * Get one of a wallet's account addresses for a given index
   * 
   * @param {KeyVaultAddrIndexOptions} options
   * @returns {Promise<Address>} Account address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid, or if index is invalid
   */
  async getAccountAddr(options = {}) {
    return this.keyVault.getAccountAddr(options);
  }

  /**
   * Get multiple account addresses from a wallet for a given range of indexes
   * 
   * @param {KeyVaultAccountSliceOptions} options
   * @returns {Promise<Address[]>} Array of account addresses
   * @throws {ValidationError} If keyVaultAddr is missing or invalid, or if fromIndex/count are invalid
   */
  async getAccountAddresses(options = {}) {
    return this.keyVault.getAccountAddresses(options);
  }

  // --- Signing Reads ---

  /**
   * Sign a raw transaction (authenticated function)
   * 
   * @param {SignTransactionOptions} options - Sign transaction options
   * @returns {Promise<Bytes>} Signed transaction
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signTransaction(options = {}) {
    return this.keyVault.signTransaction(
      await this._authProofBuilder.encode(options)
    );
  }

  /**
   * Sign an EIP-191 message (authenticated function)
   * 
   * @param {SignMessageOptions} options - Sign message options
   * @returns {Promise<Bytes>} Signed message (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signMessage(options = {}) {
    return this.keyVault.signMessage(
      await this._authProofBuilder.encode(options)
    );
  }

  /**
   * Sign a 32-byte hash (authenticated function)
   * 
   * @param {SignHashOptions} options - Sign hash options
   * @returns {Promise<Bytes>} Signed hash (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async sign(options = {}) {
    return this.keyVault.sign(
      await this._authProofBuilder.encode(options)
    );
  }


  /**
   * EIP-7702-style authorization signing via KeyVault (same digest as ethers {@link ethers.hashAuthorization}).
   * Orchestration lives in {@code internal/crypto/signAuthorization.js}; hashing / verification / encoding 
   * helpers in {@code internal/crypto/authorization.js} (barrel: {@code internal/crypto/index.js}).
   *
   * When {@code chainId} or {@code nonce} are omitted they are read from {@code options.provider}, else 
   * from {@link Monstera.prototype.readProvider} / {@link Monstera.prototype.writeSigner}. 
   * For an authorization on a chain different from the SDK RPC, pass {@code provider} connected 
   * to that chain so nonce and chain id stay consistent.
   *
   * @param {SignAuthorizationOptions} options
   * @returns {Promise<SignedAuthorizationResult>}
   */
  async signAuthorization(options = {}) {
    return executeSignAuthorization(
      {
        keyVault: this.keyVault,
        fallbackProvider: this.readProvider ?? this.writeSigner?.provider ?? null
      },
      await this._authProofBuilder.encode(options),
      options
    );
  }

  /**
   * Execute a function with an auth proof (authenticated function)
   * 
   * @param {ExecuteWithAuthOptions} options
   * @returns {Promise<Bytes>} Execute function result (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async executeWithAuth(options = {}) {
    return this.keyVault.executeWithAuth(
      await this._authProofBuilder.encode(options)
    );
  }

  /**
   * Get all imported key IDs (V2)
   *
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<Bytes32[]>} Array of imported key IDs
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getImportedKeyIds(options = {}) {
    return this.keyVault.getImportedKeyIds(options);
  }

  /**
   * Get metadata for an imported key (V2)
   *
   * @param {KeyVaultImportedKeyOptions} options
   * @returns {Promise<KeyMetadataResult>} Key metadata (curve, chain, active, labelHash)
   * @throws {ValidationError} If keyVaultAddr or keyId is missing or invalid
   */
  async getKeyMetadata(options = {}) {
    return this.keyVault.getKeyMetadata(options);
  }

  /**
   * Check if a key exists (V2)
   *
   * @param {KeyVaultImportedKeyOptions} options
   * @returns {Promise<boolean>} True if key exists, false otherwise
   * @throws {ValidationError} If keyVaultAddr or keyId is missing or invalid
   */
  async keyExists(options = {}) {
    return this.keyVault.keyExists(options);
  }

  /**
   * Sign a hash with an imported key (V2, authenticated view)
   *
   * @param {SignWithImportedKeyOptions} options - Sign with imported key options
   * @returns {Promise<Bytes>} Signature (format depends on curve)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signWithImportedKey(options = {}) {
    return this.keyVault.signWithImportedKey(
      await this._authProofBuilder.encode(options)
    );
  }

  /**
   * Get the address for an imported key (V2)
   *
   * @param {KeyVaultImportedKeyOptions} options
   * @returns {Promise<Bytes>} Address (Ethereum address, Solana pubkey, etc. as bytes)
   * @throws {ValidationError} If keyVaultAddr or keyId is missing or invalid
   */
  async getImportedKeyAddr(options = {}) {
    return this.keyVault.getImportedKeyAddr(options);
  }

  /**
   * Get Solana address at HD index (V2)
   *
   * @param {KeyVaultAddrIndexOptions} options
   * @returns {Promise<Bytes>} Solana public key (bytes)
   * @throws {ValidationError} If keyVaultAddr or index is missing or invalid
   */
  async getSolanaAddr(options = {}) {
    return this.keyVault.getSolanaAddr(options);
  }

  /**
   * Sign a Solana message (V2, authenticated view)
   *
   * @param {SignSolanaOptions} options - Sign Solana options
   * @returns {Promise<Bytes>} Signature
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signSolana(options = {}) {
    return this.keyVault.signSolana(
      await this._authProofBuilder.encode(options)
    );
  }

  // --- Auth Reads ---

  /**
   * Check if a wallet is configured
   * 
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isPasswordConfigured(options = {}) {
    return this.auth.password.isConfigured(options);
  }

  /**
   * Verify password
   * 
   * @param {VerifyPasswordOptions} options
   * @returns {Promise<boolean>} True if password is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async isPasswordValid(options = {}) {
    const { keyVaultAddr, currentPassword } = options;
    const authProof = currentPassword;
    return this.auth.password.verify({ keyVaultAddr, authProof });
  }

  /**
   * Check if a wallet is configured
   * 
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isWalletSignatureConfigured(options = {}) {
    return this.auth.walletSignature.isConfigured(options);
  }

  /**
   * Check if an address is whitelisted for a wallet
   * 
   * @param {WhitelistCheckOptions} options
   * @returns {Promise<boolean>} True if address is whitelisted, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async isWhitelisted(options = {}) {
    return this.auth.walletSignature.isWhitelisted(options);
  }

  /**
   * Get all whitelisted addresses for a wallet
   * 
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<Address[]>} Whitelist addresses
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getWhitelist(options = {}) {
    return this.auth.walletSignature.getWhitelist(options);
  }

  /**
   * Get the EIP-712 domain separator
   * 
   * @param {Record<string, unknown>} [options={}] - Options object
   * @returns {Promise<Bytes32>} EIP-712 domain separator
   */
  async getDomainSeparator(options = {}) {
    return this.auth.walletSignature.getDomainSeparator(options);
  }

  /**
   * Verify a signature
   * 
   * @param {CreateAuthProofWalletSignatureOptions} options
   * @returns {Promise<boolean>} True if signature is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async isWalletSignatureValid(options = {}) {    
    const authProof = await this.createAuthProofWalletSignature(options);
    return this.auth.walletSignature.verify({keyVaultAddr: options.keyVaultAddr, authProof});
  }

  /**
   * Check if a wallet is configured with password dual factor
   * 
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isDualFactorConfigured(options = {}) {
    return this.auth.dualFactor.isConfigured(options);
  }

  /**
   * Verify dual-factor auth proof (minute password signature + guardian EIP-712).
   *
   * @param {CreateAuthProofDualFactorOptions} options
   * @returns {Promise<boolean>} True if both factors verify
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async isPasswordDualFactorValid(options = {}) {
    const authProof = await this.createAuthProofDualFactor(options);
    return this.auth.dualFactor.verify({ keyVaultAddr: options.keyVaultAddr, authProof });
  }

  /**
   * Get the guardian of a wallet
   * 
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<Address>} Guardian address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getGuardian(options = {}) {
    return this.auth.dualFactor.getGuardian(options);
  }

  /**
   * Get the EIP-712 domain separator for dual factor
   * 
   * @param {Record<string, unknown>} [options={}] - Options object
   * @returns {Promise<Bytes32>} EIP-712 domain separator
   */
  async getDomainSeparatorDualFactor(options = {}) {
    return this.auth.dualFactor.getDomainSeparator(options);
  }

  /**
   * Check if a wallet is configured with password minute signature
   * 
   * @param {KeyVaultAddrOptions} options
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isPasswordMinuteSignatureConfigured(options = {}) {
    return this.auth.passwordMinuteSignature.isConfigured(options);
  }

  /**
   * Verfiy minute-bucket ECDSA siganture using password hash
   *
   * @param {CreateAuthProofMinuteSignatureOptions} options
   * @returns {Promise<boolean>} True if signature matches derived signer for current minute bucket
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {NetworkError} If failed to read latest block from provider
   */
  async isPasswordMinuteSignatureValid(options = {}) {
    const { keyVaultAddr, passwordHash } = options;
    const proofData = await this.createAuthProofMinuteSignature({
      keyVaultAddr,
      passwordHash
    });
    const authProof = proofData.authProof;
    return this.auth.passwordMinuteSignature.verify({ keyVaultAddr, authProof });
  }


  // ============================================================================
  // Write Methods
  // ============================================================================

  // --- Factory Writes ---

  /**
   * Update the WalletLogic implementation for all wallets (Admin function)
   * 
   * This updates the orchestration layer, not the key security.
   * 
   * @param {UpdateWalletLogicImplOptions} options
   * @returns {Promise<UpdateWalletLogicImplAddrResult>}
   * @throws {ValidationError} If newLogicAddr is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateWalletLogicImplAddr(options = {}) {
    return this.factory.updateWalletLogicImplAddr(options);
  }

  /**
   * Transfer admin ownership role to a new address (Admin function)
   * 
   * @param {TransferAdminOptions} options
   * @returns {Promise<TransferAdminResult>}
   * @throws {ValidationError} If newAdminAddr is missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async transferAdmin(options = {}) {
    return this.factory.transferAdmin(options);
  }

  // --- KeyVault Writes ---

  /**
   * Update the keyVaultImplementation contract address (authenticated function)
   * 
   * @param {UpdateKeyVaultImplOptions} options
   * @returns {Promise<UpdateKeyVaultImplAddrResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateKeyVaultImplAddr(options = {}) {
    return this.keyVault.updateKeyVaultImplAddr(
      await this._authProofBuilder.encode(options)
    );
  }

  /**
   * Update the authenticator contract address (Authenticated function)
   * 
   * @param {UpdateAuthenticatorOptions} options - Update authenticator options
   * @returns {Promise<UpdateAuthenticatorAddrResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateAuthenticatorAddr(options = {}) {
    return this.keyVault.updateAuthenticatorAddr(
      await this._authProofBuilder.encode(options)
    );
  }

  /**
   * Import an external private key (V2)
   *
   * @param {ImportKeyOptions} options - Import key options
   * @returns {Promise<ImportKeyResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async importKey(options = {}) {
    return this.keyVault.importKey(
      await this._authProofBuilder.encode(options)
    );
  }

  /**
   * Deactivate an imported key (V2, soft delete)
   *
   * @param {DeactivateActivateKeyOptions} options
   * @returns {Promise<DeactivateKeyResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async deactivateKey(options = {}) {
    return this.keyVault.deactivateKey(
      await this._authProofBuilder.encode(options)
    );
  }

  /**
   * Reactivate a previously deactivated key (V2)
   *
   * @param {DeactivateActivateKeyOptions} options
   * @returns {Promise<ActivateKeyResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async activateKey(options = {}) {
    return this.keyVault.activateKey(
      await this._authProofBuilder.encode(options)
    );
  }

  /**
   * Set base keys for a chain's HD derivation (V2)
   *
   * @param {SetChainBaseKeysOptions} options - Set chain base keys options
   * @returns {Promise<BaseTransactionResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async setChainBaseKeys(options = {}) {
    return this.keyVault.setChainBaseKeys(
      await this._authProofBuilder.encode(options)
    );
  }

  // --- Auth Writes ---

  /**
   * Update the password of a wallet
   * 
   * @param {UpdatePasswordOptions} options
   * @returns {Promise<UpdatePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updatePassword(options = {}) {
    return this.auth.password.updatePassword(options);
  }

  /**
   * Add a new address to the whitelist
   * 
   * @param {AddWhitelistOptions} options
   * @returns {Promise<AddToWhitelistResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async addToWhitelist(options = {}) {
    const authProof = await this.createAuthProofWalletSignature(options);
    return this.auth.walletSignature.addToWhitelist({keyVaultAddr: options.keyVaultAddr, authProof, addressToAdd: options.addressToAdd});
  }

  /**
   * Remove an address from the whitelist
   * 
   * @param {RemoveWhitelistOptions} options
   * @returns {Promise<RemoveFromWhitelistResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async removeFromWhitelist(options = {}) {
    const authProof = await this.createAuthProofWalletSignature(options);
    return this.auth.walletSignature.removeFromWhitelist({keyVaultAddr: options.keyVaultAddr, authProof, addressToRemove: options.addressToRemove});
  }

  /**
   * Update password hash (dual-factor auth required).
   *
   * @param {UpdatePasswordDualFactorOptions} options
   * @returns {Promise<UpdatePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updatePasswordDualFactor(options = {}) {
    const authProof = await this.createAuthProofDualFactor(options);
    return this.auth.dualFactor.updatePassword({ keyVaultAddr: options.keyVaultAddr, authProof, newPasswordHash: options.newPasswordHash });
  }

  /**
   * Update guardian (dual-factor auth required).
   *
   * @param {UpdateGuardianOptions} options
   * @returns {Promise<UpdateGuardianResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateGuardian(options = {}) {
    const authProof = await this.createAuthProofDualFactor(options);
    return this.auth.dualFactor.updateGuardian({ keyVaultAddr: options.keyVaultAddr, authProof, newGuardian: options.newGuardian });
  }

  /**
   * Update password hash (current password bytes must match stored hash).
   *
   * @param {UpdatePasswordOptions} options
   * @returns {Promise<UpdatePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updatePasswordMinuteSignature(options = {}) {
    return this.auth.passwordMinuteSignature.updatePassword(options);
  }
}

export default Monstera;
