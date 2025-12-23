/**
 * Monstera Wallet SDK
 * 
 * Main SDK class for interacting with Monstera wallet contracts.
 * Provides clean API for read and write operations.
 */

const { resolveBaseConfig, NETWORKS, DEFAULT_ADDRESSES, REQUIRED_ADDRESSES } = require('../config/networks');
const { createProvider, createWriteSigner } = require('../providers/sapphire');
const { createAuthProof } = require('../crypto/wallet');
const WalletFactoryClient = require('../clients/factory');
const WalletLogicClient = require('../clients/logic');
const KeyVaultClient = require('../clients/keyVault');
const { AuthenticatorClient } = require('../clients/auth');
const { ValidationError } = require('../errors');

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
   * @param {'testnet'|'mainnet'} options.network - Network to use
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
   * @param {'testnet'|'mainnet'} options.network - Network to use
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
    return require('../../package.json').version;
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

module.exports = Monstera;