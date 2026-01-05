/**
 * Monstera Wallet SDK
 * 
 * Main SDK class for interacting with Monstera wallet contracts.
 * Provides clean API for read and write operations.
 */

// Internal config
import { DEFAULT_ADDRESSES, NETWORKS, REQUIRED_ADDRESSES, resolveBaseConfig } from '../config/networks.js';

// Internal clients
import WalletFactoryClient from '../clients/factory/index.js';
import WalletLogicClient from '../clients/logic/index.js';
import KeyVaultClient from '../clients/keyVault/index.js';
import { AuthenticatorClient } from '../clients/auth/index.js';

// Internal utilities
import { createAuthProof } from '../crypto/wallet.js';
import { createProvider, createWriteSigner } from '../providers/sapphire.js';

// Internal errors
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
  
  constructor(config) {
    this.config = config;

    this.version = Monstera.version;

    // Initialize read provider (for read operations)
    this.readProvider = config.provider ?? createProvider(config.rpcUrl);
    
    // Initialize write signer (for write operations with Sapphire wrapper)
    this.writeSigner = config.signer ? createWriteSigner(config.signer, config.rpcUrl) : null;

    // Wire domain clients
    this.factory = new WalletFactoryClient(this.readProvider, this.writeSigner, config);
    this.logic = new WalletLogicClient(this.readProvider, this.writeSigner, config);
    this.keyVault = new KeyVaultClient(this.readProvider, this.writeSigner, config);
    this.auth = new AuthenticatorClient(this.readProvider, this.writeSigner, config);
  }

  // ============================================================================
  // Static methods
  // ============================================================================

  /**
   * Connect to Monstera on a given network
   * 
   * Creates and configures an SDK client. Signer is required for write operations.
   * 
   * @param {Object} options
   * @param {Boolean} options.mainnet - true for mainnet, false for testnet
   * @param {import('ethers').Signer | string} options.signer
   *        A Signer. If you pass a private key string, it must be a 0x-prefixed hex key.
   * @param {String} [options.rpcUrl] - Optional custom RPC URL (defaults to network preset).
   * @param {Object} [options.addresses] - Optional contract address overrides.
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
  
    const base = resolveBaseConfig(options);
  
    return new Monstera({
      ...base,
      signer,      // write-capable identity
      provider: null
    });
  }
  
  /**
   * Connect to Monstera on a given network
   * 
   * Creates and configures an SDK client. Provider supports read operations only.
   * 
   * @param {Object} options
   * @param {Boolean} options.mainnet - true for mainnet, false for testnet
   * @param {import('ethers').Provider} options.provider - A Provider (optional)
   * @param {String} [options.rpcUrl] - Optional custom RPC URL (defaults to network preset).
   * @param {Object} [options.addresses] - Optional contract address overrides.
   * @returns {Monstera} SDK instance
   */
  static readonly(options) {
    const base = resolveBaseConfig(options);
  
    // Option A: allow passing provider explicitly
    const provider = options?.provider ?? null;
  
    // If you want readonly to work with no provider passed, just rely on base.rpcUrl
    // because your constructor already does getReadProvider(this.rpcUrl).
    return new Monstera({
      ...base,
      provider,   // optional
      signer: null
    });
  }

  // ============================================================================
  // Static Properties (Class-Level Constants)
  // ============================================================================

  /**
   * Version of the SDK
   * @static
   * @readonly
   */
  static get version() {
    // In browser builds, version is injected at build time
    // @ts-ignore
    if (typeof __MONSTERA_VERSION__ !== 'undefined') {
      // @ts-ignore
      return __MONSTERA_VERSION__;
    }
    // Node.js environment - lazy load createRequire
    try {
      if (typeof window === 'undefined' && typeof import.meta !== 'undefined') {
        // Use dynamic import to avoid top-level await
        const { createRequire } = require('module');
        const requireFn = createRequire(import.meta.url);
        return requireFn('../../package.json').version;
      }
    } catch (e) {
      // Fallback if require fails (e.g., in browser build)
    }
    return 'unknown';
  }
  
  /**
   * Network presets for testnet and mainnet
   * @static
   * @readonly
   */
  static get networks() {
    return NETWORKS;
  }

  /**
   * Default contract addresses for testnet and mainnet
   * @static
   * @readonly
   */
  static get defaultAddresses() {
    return DEFAULT_ADDRESSES;
  }

  /**
   * Required contract addresses for the SDK to function
   * @static
   * @readonly
   */
  static get requiredAddresses() {
    return REQUIRED_ADDRESSES;
  }

  // ============================================================================
  // Instance Properties (Convenience Getters)
  // ============================================================================

  /**
   * Network name for the configured network
   * @readonly
   */
  get network() { return this.config.network; }

  /**
   * Chain ID for the configured network
   * @readonly
   */
  get chainId() { return this.config.chainId; }

  /**
   * RPC URL for the configured network
   * @readonly
   */
  get rpcUrl() { return this.config.rpcUrl; }

  /**
   * Contract addresses for the configured network
   * @readonly
   */
  get addresses() { return this.config.addresses; }

  /**
   * Provider instance (if provided)
   * @readonly
   */
  get provider() { return this.config.provider; }

  // ============================================================================
  // Instance Methods
  // ============================================================================

  /**
   * Check if SDK instance can perform write operations
   * @returns {Boolean}
   */
  canWrite() {
    return this.writeSigner !== null;
  }

  /**
   * Get the signer address (if available)
   * @returns {Promise<String|null>}
   */
  async getSignerAddress() {
    if (!this.writeSigner) return null;
    return await this.writeSigner.getAddress();
  }

  // ============================================================================
  // WalletFactoryClient Method Delegation
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
    return this.factory.isWallet(options);
  }

  /**
   * Get the admin address
   * 
   * @param {Object} [options={}] - Options object
   * @returns {Promise<String>} Admin address
   */
  async getAdmin(options = {}) {
    return this.factory.getAdmin(options);
  }

  /**
   * Get current WalletLogic implementation (current walletLogic contract address)
   * 
   * @param {Object} [options={}] - Options object
   * @returns {Promise<String>} Current WalletLogic implementation
   */
  async getWalletLogicImplAddr(options = {}) {
    return this.factory.getWalletLogicImplAddr(options);
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
    return this.factory.getWalletKeyVault(options);
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
    return this.factory.getStorageAddr(options);
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
    return this.factory.getBeaconAddr(options);
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
   * @param {String} [options.authenticator] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
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
   *      2. KeyVault (auth + signing, user-upgradeable)
   *      3. WalletLogic proxy (orchestration, admin-upgradeable)
   * 
   * @param {Object} options - Wallet creation options
   * @param {String} [options.authenticator] - Authenticator contract address (optional, defaults to PasswordAuthenticator)
   * @param {Bytes} options.authConfig - Configuration data for the authenticator (bytes)
   * @param {String} options.mnemonic - Mnemonic phrase (BIP39)
   * @returns {Promise<Object>} Creation result with wallet address, authenticator address, tx hash, and mnemonic
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
    return this.factory.createWalletWithCustomLogic(options);
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
    return this.factory.upgradeWalletLogicImplAddr(options);
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
    return this.factory.transferAdmin(options);
  }

  // ============================================================================
  // PasswordAuthenticatorClient Method Delegation
  // ============================================================================

  /**
   * Check if a wallet is configured
   * 
   * @param {Object} options - Check if wallet is configured options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<Boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddress is missing or invalid
   */
  async isPasswordConfigured(options = {}) {
    return this.auth.password.isConfigured(options);
  }

  /**
   * Verify password
   * 
   * @param {Object} options - Verify password options
   * @param {String} options.keyVaultAddress - KeyVault contract address
   * @param {Bytes} options.authProof - The raw password bytes (utf8 encoded string)
   * @returns {Promise<Boolean>} True if password is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async verifyPassword(options = {}) {
    return this.auth.password.verify(options);
  }

  /**
   * Change the password of a wallet
   * 
   * @param {Object} options - Change password options
   * @param {String} options.keyVaultAddress - KeyVault address of the wallet
   * @param {Bytes} options.currentPassword - Raw password bytes (utf8 encoded string)
   * @param {Bytes32} options.newPasswordHash - New password hash (bytes32)
   * @returns {Promise<Object>} Change password result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async changePassword(options = {}) {
    return this.auth.password.changePassword(options);
  }

  /**
   * Configure password
   * 
   * @param {Object} options - Configure password options
   * @param {String} options.keyVaultAddress - KeyVault contract address
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config is the password hash (keccak256 of password)
   * @returns {Promise<Object>} Configure wallet result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configurePassword(options = {}) {
    return this.auth.password.configure(options);
  }

  // ============================================================================
  // WalletSignatureAuthenticatorClient Method Delegation
  // ============================================================================

  /**
   * Check if a wallet is configured
   * 
   * @param {Object} options - Is configured options
   * @param {String} options.keyVaultAddress - KeyVault address of the wallet
   * @returns {Promise<Boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddress is missing or invalid
   */
  async isWalletSignatureConfigured(options = {}) {
    return this.auth.walletSignature.isConfigured(options);
  }

  /**
   * Check if an address is whitelisted for a wallet
   * 
   * @param {Object} options - Is whitelisted options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {String} options.addressToCheck - Address to check if it is whitelisted
   * @returns {Promise<Boolean>} True if address is whitelisted, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async isWhitelisted(options = {}) {
    return this.auth.walletSignature.isWhitelisted(options);
  }

  /**
   * Get all whitelisted addresses for a wallet
   * 
   * @param {Object} options - Get whitelist options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @returns {Promise<Array<String>>} Whitelist addresses
   * @throws {ValidationError} If keyVaultAddress is missing or invalid
   */
  async getWhitelist(options = {}) {
    return this.auth.walletSignature.getWhitelist(options);
  }

  /**
   * Get the EIP-712 domain separator
   * 
   * @param {Object} [options={}] - Options object
   * @returns {Promise<Bytes32>} EIP-712 domain separator
   */
  async getDomainSeparator(options = {}) {
    return this.auth.walletSignature.getDomainSeparator(options);
  }

  /**
   * Verify a signature
   * 
   * @param {Object} options - Verify options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature), Signature is over EIP-712 typed data: WalletAuth(wallet, deadline)
   * @returns {Promise<Boolean>} True if signature is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async verifyWalletSignature(options = {}) {
    return this.auth.walletSignature.verify(options);
  }

  /**
   * Add a new address to the whitelist
   * 
   * @param {Object} options - Add to whitelist options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature)
   * @param {String} options.newAddress - New address to add to the whitelist
   * @returns {Promise<Object>} Transaction receipt
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async addToWhitelist(options = {}) {
    return this.auth.walletSignature.addToWhitelist(options);
  }

  /**
   * Configure the wallet signature authenticator
   * 
   * @param {Object} options - Configure options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config is the whitelist addresses 
   * @returns {Promise<Object>} Configure wallet result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configureWalletSignature(options = {}) {
    return this.auth.walletSignature.configure(options);
  }

  /**
   * Remove an address from the whitelist
   * 
   * @param {Object} options - Remove from whitelist options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authProof - Authentication proof (bytes); authProof = abi.encode(uint256 deadline, bytes signature)
   * @param {String} options.addressToRemove - Address to remove from the whitelist
   * @returns {Promise<Object>} Transaction receipt
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async removeFromWhitelist(options = {}) {
    return this.auth.walletSignature.removeFromWhitelist(options);
  }

  // ============================================================================
  // AuthenticatorClient Method Delegation
  // ============================================================================

  /**
   * Get a specific authenticator client by type
   * 
   * @param {String} type - Authenticator type ('walletSignature', 'password', etc.)
   * @returns {Object} Authenticator client instance
   * @throws {ValidationError} If authenticator type is not found
   */
  getAuthenticatorClient(type) {
    return this.auth.getClient(type);
  }

  /**
   * Get all registered authenticator types
   * 
   * @returns {Array<String>} Array of authenticator type names
   */
  getAvailableAuthenticatorTypes() {
    return this.auth.getAvailableTypes();
  }

  // ============================================================================
  // KeyVaultClient Method Delegation
  // ============================================================================

  /**
   * Get the storage contract address holding the keys
   * 
   * @param {Object} options - Get storage address options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<String>} Storage contract address
   * @throws {ValidationError} If keyVaultAddress is missing or invalid
   */
  async getKeyVaultStorageAddr(options = {}) {
    return this.keyVault.getStorageAddr(options);
  }

  /**
   * Get the authenticator contract address for a wallet 
   * 
   * @param {Object} options - Get authenticator options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<String>} Authenticator address
   * @throws {ValidationError} If keyVaultAddress is missing or invalid
   */
  async getKeyVaultAuthenticator(options = {}) {
    return this.keyVault.getAuthenticator(options);
  }

  /**
   * Get the current KeyVaultImplementation contract address
   * 
   * @param {Object} options - Get implementation options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<String>} Implementation address
   * @throws {ValidationError} If keyVaultAddress is missing or invalid
   */
  async getKeyVaultImplAddr(options = {}) {
    return this.keyVault.getKeyVaultImplAddr(options);
  }

  /**
   * Check if a given keyVault is initialized 
   * 
   * @param {Object} options - Check if keyVault is initialized options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<Boolean>} True if keyVault is initialized, false otherwise
   * @throws {ValidationError} If keyVaultAddress is missing or invalid
   */
  async isKeyVaultInitialized(options = {}) {
    return this.keyVault.isInitialized(options);
  }

  /**
   * Get one of a wallet's account addresses for a given index
   * 
   * @param {Object} options - Get account address options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Number} options.index - Account index (uint32)
   * @returns {Promise<String>} Account address
   * @throws {ValidationError} If keyVaultAddress is missing or invalid, or if index is invalid
   */
  async keyVaultGetAccountAddress(options = {}) {
    return this.keyVault.getAccountAddress(options);
  }

  /**
   * Get multiple account addresses from a wallet for a given range of indexes
   * 
   * @param {Object} options - Get account addresses options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Number} options.fromIndex - From index (uint32)
   * @param {Number} options.count - Count (uint32)
   * @returns {Promise<Array<String>>} Array of account addresses
   * @throws {ValidationError} If keyVaultAddress is missing or invalid, or if fromIndex/count are invalid
   */
  async keyVaultGetAccountAddresses(options = {}) {
    return this.keyVault.getAccountAddresses(options);
  }

  /**
   * Sign a raw transaction (authenticated function)
   * 
   * @param {Object} options - Sign transaction options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - Authentication proof (raw password bytes or wallet signature auth proof)
   * @param {Number|BigInt} options.index - Account index
   * @param {Number|BigInt} options.nonce - Nonce
   * @param {Number|BigInt} options.gasPrice - Gas price
   * @param {Number|BigInt} options.gasLimit - Gas limit
   * @param {String} options.to - To address
   * @param {Number|BigInt} options.value - Value
   * @param {Bytes} options.txData - Transaction data (bytes)
   * @param {Number|BigInt} options.chainId - Chain ID
   * @returns {Promise<String>} Signed transaction
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async keyVaultSignTransaction(options = {}) {
    return this.keyVault.signTransaction(options);
  }

  /**
   * Sign an EIP-191 message (authenticated function)
   * 
   * @param {Object} options - Sign message options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {Number|BigInt} options.index - Account index (uint32)
   * @param {Bytes} options.message - Message to sign (bytes)
   * @returns {Promise<Bytes>} Signed message (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async keyVaultSignMessage(options = {}) {
    return this.keyVault.signMessage(options);
  }

  /**
   * Sign a 32-byte hash (authenticated function)
   * 
   * @param {Object} options - Sign hash options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {Number|BigInt} options.index - Account index (uint32)
   * @param {Bytes32} options.hash - Hash to sign (bytes32)
   * @returns {Promise<Bytes>} Signed hash (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async keyVaultSign(options = {}) {
    return this.keyVault.sign(options);
  }

  /**
   * Execute a function with an auth proof (authenticated function)
   * 
   * @param {Object} options - Execute function options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {Bytes} options.implCall - Implementation call (bytes)
   * @returns {Promise<Bytes>} Execute function result (bytes)
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async executeWithAuth(options = {}) {
    return this.keyVault.executeWithAuth(options);
  }

  /**
   * Initialize a KeyVault contract
   * 
   * @param {Object} options - Initialize key vault options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {String} options.storageAddr - WalletStorage contract address 
   * @param {String} options.authAddr - Authenticator contract address
   * @param {Bytes32} options.accessToken - Secret token for storage access (bytes32)
   * @returns {Promise<Object>} Initialize key vault result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   */
  async initializeKeyVault(options = {}) {
    return this.keyVault.initialize(options);
  }

  /**
   * Upgrade the keyVaultImplementation contract address (authenticated function)
   * 
   * @param {Object} options - Upgrade keyVaultImplementation options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {String} options.newImplAddr - New keyVaultImplementation contract address
   * @returns {Promise<Object>} Upgrade keyVaultImplementation result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async keyVaultUpgradeKeyVaultImpl(options = {}) {
    return this.keyVault.upgradeKeyVaultImpl(options);
  }

  /**
   * Change the authenticator (Authenticated function)
   * 
   * @param {Object} options - Change authenticator options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Authentication proof (bytes)
   * @param {String} options.newAuthenticatorAddr - New authenticator contract address
   * @param {Bytes} options.newAuthConfig - New authentication configuration (bytes)
   * @returns {Promise<Object>} Change authenticator result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async changeKeyVaultAuthenticator(options = {}) {
    return this.keyVault.changeAuthenticator(options);
  }

  /**
   * Create an auth proof for a wallet
   * 
   * @param {Object} options - Create auth proof options
   * @param {Object} options.signer - Signer (Wallet or HDNodeWallet) trying to authenticate
   * @param {String} options.keyVault - KeyVault address of the wallet trying to authenticate
   * @param {String} options.authenticator - Wallet signature authenticator contract address (optional, defaults to the one in the config)
   * @param {Number} options.deadline - Deadline for the auth proof (optional, defaults to 1h from now)
   * @param {String} options.chainId - Chain ID (optional, defaults to the one in the config)
   * @returns {Promise<String>} Auth proof (bytes)
   */
  async createAuthProof(options = {}) {
    const { signer, keyVault } = options;
    let { authenticator, deadline, chainId } = options;

    // Set default authenticator if not provided
    if (!authenticator) {
      authenticator = this.config.addresses.walletSignatureAuth;
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

    const authProof = await createAuthProof(signer, chainId, authenticator, deadline, keyVault);

    return authProof;
  }

}

export default Monstera;