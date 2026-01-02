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