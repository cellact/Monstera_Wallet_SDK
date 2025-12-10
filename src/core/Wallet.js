/**
 * Wallet Class - Core wallet functionality with contract interactions
 * 
 * Wallet creation and operations are handled through smart contract calls.
 */

const ContractClient = require('./contracts/ContractClient');
const { ConfigurationError, ValidationError } = require('../errors/WalletError');
const { validateUsername, validateSecret, validateAddress, validatePrivateKey, validateRpcUrl } = require('../utils/validation');

class Wallet {
  constructor(options = {}) {
    this.address = options.address || null;
    this.publicKey = options.publicKey || null;
    this.username = options.username || null;
    this.network = options.network || 'ethereum';
    
    // Contract client for interacting with smart contracts
    this.contractClient = new ContractClient({
      network: this.network,
      rpcUrl: options.rpcUrl,
      contractAddress: options.contractAddress,
      ...options.contracts
    });
    
    // Configuration
    this.config = {
      contractAddress: options.contractAddress,
      ...options.config
    };
  }

  /**
   * Create a new wallet by calling the contract's createUser method
   * 
   * @param {Object} options - Wallet creation options
   * @param {String} options.username - Username for the wallet
   * @param {String|Buffer} options.secret - User's secret/password (will be converted to bytes)
   * @param {String} options.contractAddress - Address of the wallet contract
   * @param {String} options.rpcUrl - RPC URL for the blockchain network
   * @param {String} options.network - Network name (default: 'ethereum')
   * @param {String} options.signerPrivateKey - Private key of authorized signer (for onlyAuthorized modifier)
   * @returns {Promise<Wallet>} Wallet instance with created address and public key
   * 
   * @example
   * const wallet = await Wallet.create({
   *   username: 'alice',
   *   secret: 'my-secret-password',
   *   contractAddress: '0x...',
   *   rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
   *   signerPrivateKey: '0x...' // Authorized signer
   * });
   */
  static async create(options = {}) {
    const { username, secret, contractAddress, rpcUrl, network, signerPrivateKey } = options;
    
    // Validate inputs with descriptive errors
    try {
      validateUsername(username);
      validateSecret(secret);
      validateAddress(contractAddress, 'contractAddress');
      validateRpcUrl(rpcUrl);
      validatePrivateKey(signerPrivateKey, 'signerPrivateKey');
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Invalid parameter: ${error.message}`,
        'create',
        error
      );
    }
    
    // Initialize contract client
    const contractClient = new ContractClient({
      network: network || 'ethereum',
      rpcUrl,
      contractAddress
    });
    
    // Convert secret to bytes if it's a string
    let secretBytes;
    if (typeof secret === 'string') {
      secretBytes = Buffer.from(secret, 'utf8');
    } else {
      secretBytes = secret;
    }
    
    // Call createUser contract method
    const result = await contractClient.callWrite(
      contractAddress,
      'createUser',
      [username, secretBytes],
      signerPrivateKey
    );
    
    // Extract return values: (address userAddress, bytes memory publicKey)
    const userAddress = result.userAddress || result[0];
    const publicKey = result.publicKey || result[1];
    
    return new Wallet({
      address: userAddress,
      publicKey: publicKey,
      username: username,
      network: network || 'ethereum',
      contractAddress,
      rpcUrl,
      contracts: options.contracts
    });
  }

  /**
   * Import/load an existing wallet by address
   * 
   * @param {Object} options - Import options
   * @param {String} options.address - Wallet address
   * @param {String} options.contractAddress - Address of the wallet contract
   * @param {String} options.rpcUrl - RPC URL for the blockchain network
   * @param {String} options.network - Network name
   * @returns {Promise<Wallet>} Wallet instance
   */
  static async import(options) {
    const { address, contractAddress, rpcUrl, network } = options;
    
    // Validate inputs with descriptive errors
    try {
      validateAddress(address, 'address');
      validateAddress(contractAddress, 'contractAddress');
      if (rpcUrl) {
        validateRpcUrl(rpcUrl);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Invalid parameter: ${error.message}`,
        'import',
        error
      );
    }
    
    return new Wallet({
      address,
      network: network || 'ethereum',
      contractAddress,
      rpcUrl,
      contracts: options.contracts
    });
  }

  /**
   * Get wallet address
   * @returns {String}
   */
  getAddress() {
    return this.address;
  }

  /**
   * Get wallet public key
   * @returns {String|Buffer}
   */
  getPublicKey() {
    return this.publicKey;
  }

  /**
   * Get username
   * @returns {String}
   */
  getUsername() {
    return this.username;
  }

  /**
   * Call a smart contract method (read-only)
   * 
   * @param {String} methodName - Method name
   * @param {Array} params - Method parameters
   * @returns {Promise<Object>} Contract call result
   */
  async callContract(methodName, params = []) {
    return await this.contractClient.callRead(
      this.config.contractAddress,
      methodName,
      params
    );
  }

  /**
   * Call a smart contract method (write/transaction)
   * 
   * @param {String} methodName - Method name
   * @param {Array} params - Method parameters
   * @param {String} privateKey - Private key for signing the transaction
   * @returns {Promise<Object>} Transaction result
   */
  async callContractWrite(methodName, params = [], privateKey) {
    if (!privateKey) {
      throw new Error('Private key required for write operations');
    }
    
    return await this.contractClient.callWrite(
      this.config.contractAddress,
      methodName,
      params,
      privateKey
    );
  }

  /**
   * Get contract client instance
   * @returns {ContractClient}
   */
  getContractClient() {
    return this.contractClient;
  }

  /**
   * Get configuration
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config };
  }
}

module.exports = Wallet;
