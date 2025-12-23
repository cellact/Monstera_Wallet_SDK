/**
 * Monstera Wallet SDK
 * 
 * Main SDK class for interacting with Monstera wallet contracts.
 * Provides clean API for read and write operations.
 */

const { resolveBaseConfig, DEFAULT_ADDRESSES, NETWORKS } = require('../config/networks');
const { getReadProvider, getWriteSigner } = require('../providers/sapphire');
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
  constructor(config) {
    this.config = config;
    this.network = config.network;
    this.chainId = config.chainId;
    this.rpcUrl = config.rpcUrl;
    this.addresses = config.addresses;
    this.signer = config.signer ?? null;
    this.provider = config.provider ?? null;
    
    // Initialize read provider (for read operations)
    this.readProvider = this.provider ?? getReadProvider(this.rpcUrl);
    
    // Initialize write signer (for write operations with Sapphire wrapper) - Only create write signer if signer exists
    this.writeSigner = this.signer ? getWriteSigner(this.signer, this.rpcUrl) : null;

    // Wire domain clients
    this.factory = new WalletFactoryClient(this.readProvider, this.writeSigner, config);

    // Initialize logic client
    this.logic = new WalletLogicClient(this.readProvider, this.writeSigner, config);

    // Initialize key vault client
    this.keyVault = new KeyVaultClient(this.readProvider, this.writeSigner, config);

    // Initialize authenticator client registry (manages all authenticator clients)
    this.auth = new AuthenticatorClient(this.readProvider, this.writeSigner, config);

    // Namespace for wallet operations
    this.wallets = {
      createAuthProof: this.createAuthProof.bind(this),
    };
  }

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

  /**
   * Contract addresses for testnet and mainnet
   * @static
   * @readonly
   */
  static get contractAddresses() {
    return DEFAULT_ADDRESSES;
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
      authenticator = this.addresses.walletSignatureAuth;
    }

    // Set deadline default if not provided
    if (!deadline) {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      deadline = nowInSeconds + 3600; // 1 hour from now
    }

    // Set chainId default if not provided
    if (!chainId) {
      chainId = this.chainId;
    }

    const authProof = await createAuthProof(signer, chainId, authenticator, deadline, keyVault);

    return authProof;
  }

}

module.exports = Monstera;