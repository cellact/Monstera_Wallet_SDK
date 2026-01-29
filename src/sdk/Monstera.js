/**
 * Monstera Wallet SDK
 * 
 * Main SDK class for interacting with Monstera wallet contracts.
 * Provides clean API for read and write operations.
 * 
 * @typedef {import('../types/index.js').DefaultContractAddresses} DefaultContractAddresses
 * @typedef {import('../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../types/index.js').NetworkPresets} NetworkPresets
 * @typedef {import('../types/index.js').WriteConnectOptions} WriteConnectOptions
 * @typedef {import('../types/index.js').ReadConnectOptions} ReadConnectOptions
 * @typedef {import('../types/index.js').InitializeOptions} InitializeOptions
 * @typedef {import('../types/index.js').TransactionResult} TransactionResult
 * @typedef {import('../types/index.js').ConfigurePasswordResult} ConfigurePasswordResult
 * @typedef {import('../types/index.js').ConfigureWalletSignatureResult} ConfigureWalletSignatureResult
 * @typedef {import('../types/index.js').WalletCreationResult} WalletCreationResult
 * @typedef {import('../types/index.js').CreateWalletWithHookOptions} CreateWalletWithHookOptions
 * @typedef {import('../types/index.js').CreateWalletWithCustomLogicOptions} CreateWalletWithCustomLogicOptions
 * @typedef {import('../types/index.js').SignTransactionOptions} SignTransactionOptions
 * @typedef {import('../types/index.js').SignMessageOptions} SignMessageOptions
 * @typedef {import('../types/index.js').SignHashOptions} SignHashOptions
 * @typedef {import('../types/index.js').UpdateWalletLogicImplAddrResult} UpdateWalletLogicImplAddrResult
 * @typedef {import('../types/index.js').UpdateResult} UpdateResult
 * @typedef {import('../types/index.js').UpdateKeyVaultImplAddrResult} UpdateKeyVaultImplAddrResult
 * @typedef {import('../types/index.js').UpdateAuthenticatorOptions} UpdateAuthenticatorOptions
 * @typedef {import('../types/index.js').UpdateAuthenticatorAddrResult} UpdateAuthenticatorAddrResult
 * @typedef {import('../types/index.js').UpdatePasswordResult} UpdatePasswordResult
 * @typedef {import('../types/index.js').AddToWhitelistResult} AddToWhitelistResult
 * @typedef {import('../types/index.js').RemoveFromWhitelistResult} RemoveFromWhitelistResult
 * @typedef {import('../types/index.js').CreateAuthProofOptions} CreateAuthProofOptions
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').Bytes} Bytes
 * @typedef {import('../types/index.js').Bytes32} Bytes32
 * @typedef {import('../types/index.js').Mnemonic} Mnemonic
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../types/index.js').AuthenticatorClientInstance} AuthenticatorClientInstance
 * @typedef {import('../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 * @typedef {import('../types/index.js').CreateWalletBaseOptions} CreateWalletBaseOptions
 * @typedef {import('../types/index.js').CreateWalletFromMnemonicOptions} CreateWalletFromMnemonicOptions
 * @typedef {import('../types/index.js').ConfigurePasswordDualFactorResult} ConfigurePasswordDualFactorResult
 * @typedef {import('../types/index.js').UpdateGuardianResult} UpdateGuardianResult
 * @typedef {import('../types/index.js').TransferAdminResult} TransferAdminResult
 */

import MonsteraConfig from '../config/monstera.js';
import MonsteraUtils from './MonsteraUtils.js';
import WalletFactoryClient from '../clients/factory/index.js';
import WalletLogicClient from '../clients/logic/index.js';
import KeyVaultClient from '../clients/keyVault/index.js';
import { AuthenticatorClient } from '../clients/auth/index.js';
import { createAuthProof } from '../crypto/wallet.js';
import { createProvider, createWriteSigner } from '../providers/sapphire.js';
import { ValidationError } from '../errors/index.js';

/**
 * Monstera Wallet SDK
 * 
 * Main entry point for wallet operations on Oasis Sapphire.
 * 
 */
class Monstera {
  // ============================================================================
  // Constructor
  // ============================================================================

  /**
   * @param {MonsteraConfigOptions} config - SDK configuration
   */
  constructor(config) {
    this.config = config;
    this.version = MonsteraConfig.version;

    // Initialize read provider (for read operations)
    this.readProvider = config.provider ?? createProvider(config.rpcUrl);
    
    // Initialize write signer (for write operations with Sapphire wrapper)
    this.writeSigner = config.signer ? createWriteSigner(config.signer, config.rpcUrl) : null;

    // Wire domain clients
    this.factory = new WalletFactoryClient(this.readProvider, this.writeSigner, config);
    this.logic = new WalletLogicClient(this.readProvider, this.writeSigner, config);
    this.keyVault = new KeyVaultClient(this.readProvider, this.writeSigner, config);
    this.auth = new AuthenticatorClient(this.readProvider, this.writeSigner, config);

    // Check version in background (non-blocking, cached)
    // Skip if disabled in config or already checked
    if (config?.checkVersion !== false && !MonsteraUtils.versionCheckDone) {
      MonsteraUtils.checkVersionOnce(this.version);
    }
  }

  // ============================================================================
  // Static methods
  // ============================================================================

  /**
   * Connect to Monstera on a given network
   * 
   * Creates and configures an SDK client. Signer is required for write operations.
   * 
   * @param {WriteConnectOptions} options - Connect options
   * @returns {Monstera} SDK instance
   */
  static connect(options) {
    const { signer } = options || {};

    if (!signer) {
      throw new ValidationError(
        'signer is required for connect() (ethers Signer or private key string)',
        'signer',
        signer
      );
    }
  
    const base = MonsteraConfig.resolveBaseConfig(options);
  
    return new Monstera({
      ...base,
      signer,      // write-capable identity
      provider: null,
      checkVersion: options?.checkVersion
    });
  }
  
  /**
   * Connect to Monstera on a given network
   * 
   * Creates and configures an SDK client. Provider supports read operations only.
   * 
   * @param {ReadConnectOptions} options - Readonly options
   * @returns {Monstera} SDK instance
   */
  static readonly(options) {
    const base = MonsteraConfig.resolveBaseConfig(options);
  
    // Option A: allow passing provider explicitly
    const provider = options?.provider ?? null;
  
    // If you want readonly to work with no provider passed, just rely on base.rpcUrl
    // because your constructor already does getReadProvider(this.rpcUrl).
    return new Monstera({
      ...base,
      provider,   // optional
      signer: null,
      checkVersion: options?.checkVersion
    });
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
   * Default contract addresses for testnet and mainnet
   * @static
   * @readonly
   * @returns {DefaultContractAddresses} Default contract addresses by network
   */
  static get defaultAddresses() {
    return MonsteraConfig.defaultAddresses;
  }

  /**
   * Required contract addresses for the SDK to function
   * @static
   * @readonly
   * @returns {string[]} Array of required address keys
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
   * @returns {number} Chain ID
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
   * Create an auth proof for a wallet
   * 
   * @param {CreateAuthProofOptions} options - Create auth proof options
   * @returns {Promise<Bytes>} Auth proof (bytes)
   */
  async createAuthProof(options = {}) {
    const { signer, keyVaultAddr } = options;
    let { authenticatorAddr, deadline, chainId } = options;

    // Set default authenticator if not provided
    if (!authenticatorAddr) {
      authenticatorAddr = this.config.addresses.walletSignatureAuth;
    }

    // Set deadline default if not provided
    if (!deadline) {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      deadline = nowInSeconds + 3600; // 1 hour from now
    }

    // Set chainId default if not provided
    if (!chainId) {
      chainId = this.config.chainId;
    }

    const authProof = await createAuthProof(signer, chainId, authenticatorAddr, deadline, keyVaultAddr);

    return authProof;
  }

  // ============================================================================
  // Initialize Methods (Write)
  // ============================================================================

  /**
   * Initialize a KeyVault contract
   * 
   * @param {InitializeOptions} options - Initialize key vault options
   * @returns {Promise<TransactionResult>}
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
   * @param {Record<string, unknown>} options - Initialize wallet logic options
   * @param {Address} options.walletAddr - Wallet proxy address (from createWallet)
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<TransactionResult>}
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
   * @param {Record<string, unknown>} options - Configure password options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config is the password hash (keccak256 of password)
   * @returns {Promise<ConfigurePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configurePassword(options = {}) {
    return this.auth.password.configure(options);
  }

  /**
   * Configure the wallet signature authenticator
   * 
   * @param {Record<string, unknown>} options - Configure options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config is the whitelist addresses 
   * @returns {Promise<ConfigureWalletSignatureResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configureWalletSignature(options = {}) {
    return this.auth.walletSignature.configure(options);
  }

  /**
   * Configure password dual factor
   * 
   * @param {Record<string, unknown>} options - Configure dual factor options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config = abi.encode(bytes32 passwordHash, address guardian)
   * @returns {Promise<ConfigurePasswordDualFactorResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configureDualFactor(options = {}) {
    return this.auth.dualFactor.configure(options);
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
    return this.factory.createWallet(options);
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
    return this.factory.createWalletFromMnemonic(options);
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
    return this.factory.createWalletWithHook(options);
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
    return this.factory.createWalletCore(options);
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
    return this.factory.createWalletWithCustomLogic(options);
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  // --- Factory Reads ---

  /**
   * Check if an address is a wallet created by this factory
   * 
   * @param {Record<string, unknown>} options - Is wallet options
   * @param {Address} options.walletAddr - Wallet address to check
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
   * @param {Record<string, unknown>} options - KeyVault options
   * @param {Address} options.walletAddr - Wallet proxy address (from createWallet)
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {ValidationError} If walletAddr is missing or invalid
   */
  async getKeyVaultAddr(options = {}) {
    return this.factory.getKeyVaultAddr(options);
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

  // --- KeyVault Reads ---

  /**
   * Get the storage contract address holding the keys
   * 
   * @param {Record<string, unknown>} options - Get storage address options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Address>} Storage contract address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getKeyVaultStorageAddr(options = {}) {
    return this.keyVault.getStorageAddr(options);
  }

  /**
   * Get the current authenticator contract address for a wallet 
   * 
   * @param {Record<string, unknown>} options - Get authenticator options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Address>} Authenticator address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getAuthenticatorAddr(options = {}) {
    return this.keyVault.getAuthenticatorAddr(options);
  }

  /**
   * Get the current KeyVaultImplementation contract address
   * 
   * @param {Record<string, unknown>} options - Get implementation options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Address>} Implementation address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async getKeyVaultImplAddr(options = {}) {
    return this.keyVault.getKeyVaultImplAddr(options);
  }

  /**
   * Check if a given keyVault is initialized 
   * 
   * @param {Record<string, unknown>} options - Check if keyVault is initialized options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<boolean>} True if keyVault is initialized, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isInitialized(options = {}) {
    return this.keyVault.isInitialized(options);
  }

  /**
   * Get one of a wallet's account addresses for a given index
   * 
   * @param {Record<string, unknown>} options - Get account address options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {number} options.index - Account index (uint32)
   * @returns {Promise<Address>} Account address
   * @throws {ValidationError} If keyVaultAddr is missing or invalid, or if index is invalid
   */
  async getAccountAddr(options = {}) {
    return this.keyVault.getAccountAddr(options);
  }

  /**
   * Get multiple account addresses from a wallet for a given range of indexes
   * 
   * @param {Record<string, unknown>} options - Get account addresses options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {number} options.fromIndex - From index (uint32)
   * @param {number} options.count - Count (uint32)
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
    return this.keyVault.signTransaction(options);
  }

  /**
   * Sign an EIP-191 message (authenticated function)
   * 
   * @param {SignMessageOptions} options - Sign message options
   * @returns {Promise<Bytes>} Signed message (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async signMessage(options = {}) {
    return this.keyVault.signMessage(options);
  }

  /**
   * Sign a 32-byte hash (authenticated function)
   * 
   * @param {SignHashOptions} options - Sign hash options
   * @returns {Promise<Bytes>} Signed hash (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async sign(options = {}) {
    return this.keyVault.sign(options);
  }

  /**
   * Execute a function with an auth proof (authenticated function)
   * 
   * @param {Record<string, unknown>} options - Execute function options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {Bytes} options.implCall - Implementation call (bytes)
   * @returns {Promise<Bytes>} Execute function result (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async executeWithAuth(options = {}) {
    return this.keyVault.executeWithAuth(options);
  }

  // --- Auth Reads ---

  /**
   * Check if a wallet is configured
   * 
   * @param {Record<string, unknown>} options - Check if wallet is configured options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isPasswordConfigured(options = {}) {
    return this.auth.password.isConfigured(options);
  }

  /**
   * Verify password
   * 
   * @param {Record<string, unknown>} options - Verify password options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authProof - The raw password bytes (utf8 encoded string)
   * @returns {Promise<boolean>} True if password is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async isPasswordValid(options = {}) {
    return this.auth.password.verify(options);
  }

  /**
   * Check if a wallet is configured
   * 
   * @param {Record<string, unknown>} options - Is configured options
   * @param {Address} options.keyVaultAddr - KeyVault address of the wallet
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isWalletSignatureConfigured(options = {}) {
    return this.auth.walletSignature.isConfigured(options);
  }

  /**
   * Check if an address is whitelisted for a wallet
   * 
   * @param {Record<string, unknown>} options - Is whitelisted options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @param {Address} options.addressToCheck - Address to check if it is whitelisted
   * @returns {Promise<boolean>} True if address is whitelisted, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async isWhitelisted(options = {}) {
    return this.auth.walletSignature.isWhitelisted(options);
  }

  /**
   * Get all whitelisted addresses for a wallet
   * 
   * @param {Record<string, unknown>} options - Get whitelist options
   * @param {Address} options.keyVaultAddr - Key vault address 
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
   * @param {Record<string, unknown>} options - Verify options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature), Signature is over EIP-712 typed data: WalletAuth(wallet, deadline)
   * @returns {Promise<boolean>} True if signature is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async isWalletSignatureValid(options = {}) {
    return this.auth.walletSignature.verify(options);
  }

  /**
   * Check if a wallet is configured with password dual factor
   * 
   * @param {Record<string, unknown>} options - Check if wallet is configured options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isDualFactorConfigured(options = {}) {
    return this.auth.dualFactor.isConfigured(options);
  }

  /**
   * Verify password with dual factor auth proof
   * 
   * @param {Record<string, unknown>} options - Verify password options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authProof - The raw auth proof bytes (utf8 encoded string) authProof = abi.encode(bytes password, uint256 deadline, bytes signature)
   * @returns {Promise<boolean>} True if password is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
   async isPasswordDualFactorValid(options = {}) {
    return this.auth.dualFactor.verify(options);
  }

  /**
   * Get the guardian of a wallet
   * 
   * @param {Record<string, unknown>} options - Get guardian options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
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


  // ============================================================================
  // Write Methods
  // ============================================================================

  // --- Factory Writes ---

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
    return this.factory.updateWalletLogicImplAddr(options);
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
    return this.factory.transferAdmin(options);
  }

  // --- KeyVault Writes ---

  /**
   * Update the keyVaultImplementation contract address (authenticated function)
   * 
   * @param {Record<string, unknown>} options - Update keyVaultImplementation options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {Address} options.newImplAddr - New keyVaultImplementation contract address
   * @returns {Promise<UpdateKeyVaultImplAddrResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateKeyVaultImplAddr(options = {}) {
    return this.keyVault.updateKeyVaultImplAddr(options);
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
    return this.keyVault.updateAuthenticatorAddr(options);
  }

  // --- Auth Writes ---

  /**
   * Update the password of a wallet
   * 
   * @param {Record<string, unknown>} options - Update password options
   * @param {Address} options.keyVaultAddr - KeyVault address of the wallet
   * @param {Bytes} options.currentPassword - Raw password bytes (utf8 encoded string)
   * @param {Bytes32} options.newPasswordHash - New password hash (bytes32)
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
   * @param {Record<string, unknown>} options - Add to whitelist options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature)
   * @param {Address} options.addressToAdd - Address to add to the whitelist
   * @returns {Promise<AddToWhitelistResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async addToWhitelist(options = {}) {
    return this.auth.walletSignature.addToWhitelist(options);
  }

  /**
   * Remove an address from the whitelist
   * 
   * @param {Record<string, unknown>} options - Remove from whitelist options
   * @param {Address} options.keyVaultAddr - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature)
   * @param {Address} options.addressToRemove - Address to remove from the whitelist
   * @returns {Promise<RemoveFromWhitelistResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async removeFromWhitelist(options = {}) {
    return this.auth.walletSignature.removeFromWhitelist(options);
  }

  /**
   * Update the password of a wallet using valid dual factor auth proof
   * 
   * @param {Record<string, unknown>} options - Update password options
   * @param {Address} options.keyVaultAddr - KeyVault address of the wallet
   * @param {Bytes} options.authProof - The raw auth proof bytes (utf8 encoded string) authProof = abi.encode(bytes password, uint256 deadline, bytes signature)
   * @param {Bytes32} options.newPasswordHash - New password hash (bytes32)
   * @returns {Promise<UpdatePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updatePasswordDualFactor(options = {}) {
    return this.auth.dualFactor.updatePassword(options);
  }

  /**
   * Update the guardian of a wallet
   * 
   * @param {Record<string, unknown>} options - Update guardian options
   * @param {Address} options.keyVaultAddr - KeyVault address of the wallet
   * @param {Bytes} options.authProof - The raw auth proof bytes (utf8 encoded string) authProof = abi.encode(bytes password, uint256 deadline, bytes signature)
   * @param {Address} options.newGuardian - New guardian address
   * @returns {Promise<UpdateGuardianResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updateGuardian(options = {}) {
    return this.auth.dualFactor.updateGuardian(options);
  }
}

export default Monstera;
