/**
 * Sapphire Wallet SDK
 * 
 * Main SDK class for interacting with Oasis Sapphire wallet contracts.
 * Provides clean API for read and write operations.
 */

const { createSdkConfig } = require('../config/networks');
const { getReadProvider, getWriteSigner } = require('../provider/sapphire');
const { generateMnemonic, deriveSeed, hashPassword } = require('../crypto/wallet');
const { getFactoryContract, parseWalletCreatedEvent } = require('../contracts/factory');
const { getWalletLogicContract } = require('../contracts/walletLogic');

/**
 * Sapphire Wallet SDK
 * 
 * Main entry point for wallet operations on Oasis Sapphire.
 * 
 * @example
 * ```javascript
 * const sdk = SapphireWalletSDK.fromConfig({
 *   network: 'testnet',
 *   addresses: {
 *     factory: '0x...',
 *     passwordAuth: '0x...'
 *   },
 *   signerOrProvider: privateKey // or Signer/Provider instance
 * });
 * 
 * const result = await sdk.wallets.createWallet({
 *   password: 'my-password'
 * });
 * ```
 */
class SapphireWalletSDK {
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
    
    // Namespace for wallet operations
    this.wallets = {
      createWallet: this.createWallet.bind(this),
      getAccountAddress: this.getAccountAddress.bind(this),
      getAccount: this.getAccount.bind(this),
      signMessage: this.signMessage.bind(this)
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
   * @returns {SapphireWalletSDK} SDK instance
   */
  static fromConfig(options) {
    const config = createSdkConfig(options);
    return new SapphireWalletSDK(config);
  }

  /**
   * Create a new wallet
   * 
   * Off-chain:
   * - Generate mnemonic
   * - Derive seed (PBKDF2)
   * - Hash password (keccak256)
   * 
   * On-chain:
   * - Call factory.createWallet(seed, PASSWORD_AUTH_ADDRESS, passwordHash)
   * - Parse WalletCreated event
   * 
   * @param {Object} options - Wallet creation options
   * @param {String} options.password - User password
   * @param {String} [options.mnemonic] - Optional mnemonic (if not provided, generates new one)
   * @param {Boolean} [options.returnMnemonic=false] - Whether to return mnemonic in result
   * @returns {Promise<Object>} Creation result with wallet address, tx hash, and optionally mnemonic
   */
  async createWallet(options = {}) {
    const { password, mnemonic: providedMnemonic, returnMnemonic = false } = options;

    if (!password || typeof password !== 'string') {
      throw new Error('Password is required');
    }

    if (!this.addresses.factory) {
      throw new Error('Factory address is required. Set it in config.addresses.factory');
    }

    if (!this.addresses.passwordAuth) {
      throw new Error('Password authenticator address is required. Set it in config.addresses.passwordAuth');
    }

    // Off-chain: Generate mnemonic (if not provided)
    const mnemonic = providedMnemonic || generateMnemonic();
    
    // Off-chain: Derive seed from mnemonic
    const seed = deriveSeed(mnemonic);
    
    // Off-chain: Hash password
    const passwordHash = hashPassword(password);
    
    // On-chain: Get factory contract with wrapped signer
    const factory = getFactoryContract(this.writeSigner, this.addresses.factory);
    
    // On-chain: Call createWallet
    try {
      const tx = await factory.createWallet(
        seed, // bytes seed
        this.addresses.passwordAuth, // address authenticator
        passwordHash // bytes authConfig (password hash)
      );
      
      // Wait for transaction
      const receipt = await tx.wait();

      // Debug: log receipt
      // console.log('[createWallet] receipt:', {
      //   hash: receipt.hash,
      //   blockNumber: receipt.blockNumber,
      //   status: receipt.status,
      //   logsLength: receipt.logs?.length
      // });
      
      // Parse WalletCreated event
      const eventData = parseWalletCreatedEvent(receipt, factory);
      
      if (!eventData) {
        throw new Error('WalletCreated event not found in transaction receipt');
      }
      
      // Build result
      const result = {
        success: true,
        wallet: eventData.wallet,
        authenticator: eventData.authenticator,
        storage: eventData.storage, // Storage contract address
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
      // Optionally include mnemonic (security: only if requested)
      if (returnMnemonic) {
        result.mnemonic = mnemonic;
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Get account address from wallet
   * 
   * @param {Object} options - Account address options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Number} options.index - Account index (uint32)
   * @returns {Promise<String>} Account address
   */
  async getAccountAddress(options = {}) {
    const { walletAddress, index } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    // index can be 0 or positive integer - check explicitly for undefined/null
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }

    // Get wallet logic contract
    const walletLogic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const accountAddress = await walletLogic.getAccountAddress(index);
      return accountAddress;
    } catch (error) {
      throw new Error(`Failed to get account address: ${error.message}`);
    }
  }

  /**
   * Get account private key and address
   * 
   * @param {Object} options - Account options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {Number} options.index - Account index
   * @returns {Promise<Object>} Account
   */
  async getAccount(options = {}) {
    const { walletAddress, authProof, index } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    // TODO: check that authProof is correct type (bytes)
    if (!authProof) {
      throw new Error('Auth proof is required');
    }
    
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }

    const walletLogic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const { privateKey, account } = await walletLogic.getAccount(authProof, index);
      const result = {
        success: true,
        privateKey: privateKey.toString(),
        accountAddress: account
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to get account: ${error.message}`);
    }
  }

  /**
   * Sign a message with a wallet (Sign EIP-191 personal message)
   * 
   * @param {Object} options - Sign message options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {Number} options.index - Account index
   * @param {Bytes} options.message - Message to sign (utf8 encoded string)
   * @returns {Promise<String>} Signed message
   */
  async signMessage(options = {}) {
    const { walletAddress, authProof, index, message } = options;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    // TODO: check that authProof is correct type (bytes)
    if (!authProof) {
      throw new Error('Auth proof is required');
    }
    
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }
    
    if (!message) {
      throw new Error('Message is required');
    }

    const walletLogic = getWalletLogicContract(this.readProvider, walletAddress);

    try {
      const signature = await walletLogic.signMessage(authProof, index, message);
      const result = {
        success: true,
        signature: signature
      };
      return result;
    } catch (error) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }
}

module.exports = SapphireWalletSDK;

