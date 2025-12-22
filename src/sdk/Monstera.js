/**
 * Monstera Wallet SDK
 * 
 * Main SDK class for interacting with Monstera wallet contracts.
 * Provides clean API for read and write operations.
 */

const { createSdkConfig, NETWORKS } = require('../config/networks');
const { getReadProvider, getWriteSigner } = require('../provider/sapphire');
const { createAuthProof } = require('../crypto/wallet');
const { Wallet, HDNodeWallet } = require('ethers');
const WalletFactoryClient = require('../clients/factory');
const WalletLogicClient = require('../clients/logic');
const KeyVaultClient = require('../clients/keyVault');
const { AuthenticatorClient } = require('../clients/auth');
const { requireAddress, requireString } = require('../internal/assert');

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
    this.signerOrProvider = config.signerOrProvider;
    
    // Initialize read provider (for read operations)
    this.readProvider = getReadProvider(this.rpcUrl);
    
    // Initialize write signer (for write operations with Sapphire wrapper)
    this.writeSigner = getWriteSigner(this.signerOrProvider, this.rpcUrl);

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
   * Create SDK instance from configuration
   * 
   * @param {Object} options - SDK configuration
   * @param {'testnet'|'mainnet'} options.network - Network to use
   * @param {String} [options.rpcUrl] - Custom RPC URL (optional)
   * @param {Object} [options.addresses] - Contract addresses
   * @param {String|Object} options.signerOrProvider - Signer or provider
   * @returns {Monstera} SDK instance
   */
  static fromConfig(options) {
    const config = createSdkConfig(options);
    return new Monstera(config);
  }

  /**
   * Network presets for testnet and mainnet
   * @static
   * @readonly
   */
  static get NETWORKS() {
    return NETWORKS;
  }

  /**
   * Create an auth proof for a wallet
   * 
   * @param {Object} options - Create auth proof options
   * @param {String} options.authenticateFor - Wallet address to authenticate for
   * @param {Object} options.signer - Signer (Wallet or HDNodeWallet) trying to authenticate
   * @param {String} options.keyVault - KeyVault address of the wallet trying to authenticate
   * @param {String} options.authenticator - Wallet signature authenticator contract address (optional, defaults to the one in the config)
   * @param {Number} options.deadline - Deadline for the auth proof (optional, defaults to 1h from now)
   * @param {String} options.chainId - Chain ID (optional, defaults to the one in the config)
   * @returns {Promise<String>} Auth proof (bytes)
   */
  async createAuthProof(options = {}) {
    const { authenticateFor, signer, keyVault } = options;
    let { authenticator, deadline, chainId } = options;

    // Validate required parameters
    requireAddress(authenticateFor, 'authenticateFor');
    requireAddress(keyVault, 'keyVault');

    if (!signer || !(signer instanceof Wallet || signer instanceof HDNodeWallet)) {
      throw new Error('Signer must be a Wallet or HDNodeWallet');
    }

    // if no authenticator contract address provided use default from config
    if (!authenticator || typeof authenticator !== 'string') {
      authenticator = this.addresses.walletSignatureAuth;
    } else {
      requireAddress(authenticator, 'authenticator');
    }

    // if deadline is provided, check if it is a number and in the future
    // Deadline is in seconds (Unix timestamp)
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (deadline !== undefined && deadline !== null) {
      if (typeof deadline !== 'number') {
        throw new Error('Deadline must be a number (Unix timestamp in seconds)');
      }
      if (deadline < nowInSeconds) {
        throw new Error('Deadline must be in the future');
      }
    } else {
      // if no deadline provided, default to 1 hour from now
      deadline = nowInSeconds + 3600; // 1 hour from now
    }

    if (chainId !== undefined && chainId !== null) {
      requireString(chainId, 'chainId');
    } else {
      // if no chainId provided, default to the one in the config
      chainId = this.chainId;
    }

    const authProof = await createAuthProof(signer, chainId, authenticator, deadline, keyVault);

    return authProof;
  }

}

module.exports = Monstera;