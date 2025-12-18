/**
 * Monstera Wallet SDK
 * 
 * Main SDK class for interacting with Monstera wallet contracts.
 * Provides clean API for read and write operations.
 */

const { createSdkConfig } = require('../config/networks');
const { getReadProvider, getWriteSigner } = require('../provider/sapphire');
const { createAuthProof } = require('../crypto/wallet');
const { getWalletSignatureAuthenticatorContract, parseAddressAddedEvent, parseAddressRemovedEvent } = require('../contracts/authenticators/WalletSignatureAuthenticator');
const { Wallet, HDNodeWallet } = require('ethers');
const { getKeyVaultContract, parseImplementationUpgradedEvent, parseAuthenticatorChangedEvent } = require('../contracts/core/keyVault');
const { getPasswordAuthenticatorContract, parsePasswordChangedEvent } = require('../contracts/authenticators/PasswordAuthenticator');
const WalletFactoryClient = require('../packages/factory');
const WalletLogicClient = require('../packages/logic');

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

    // Namespace for wallet operations
    this.wallets = {
      // SDK function - no contract call 
      createAuthProof: this.createAuthProof.bind(this),

      // WalletSignatureAuthenticator functions
      // verify: this.verify.bind(this),
      // configure: this.configure.bind(this),
      addToWhitelist: this.addToWhitelist.bind(this),
      removeFromWhitelist: this.removeFromWhitelist.bind(this),
      isConfiguredWalletSigAuth: this.isConfiguredWalletSigAuth.bind(this), // isConfigured in WalletSignatureAuthenticator contract
      isWhitelisted: this.isWhitelisted.bind(this),
      getWhitelist: this.getWhitelist.bind(this),
      getDomainSeparator: this.getDomainSeparator.bind(this),

      // PasswordAuthenticator functions
      // verify: this.verify.bind(this),
      // configure: this.configure.bind(this),
      changePassword: this.changePassword.bind(this),
      isConfigured: this.isConfigured.bind(this),

      // KeyVault functions
      getStorageAddr: this.getStorageAddr.bind(this), // state variable in keyVault contract
      getAuthenticatorKeyVault: this.getAuthenticatorKeyVault.bind(this), // authenticator in keyVault contract; state variable in keyVault contract
      getKeyVaultImplAddr: this.getKeyVaultImplAddr.bind(this), // implementation in keyVault contract; state variable in keyVault contract
      isInitializedKeyVault: this.isInitializedKeyVault.bind(this), // initialized in keyVault contract; state variable in keyVault contract
      // initilizeKeyVault: this.initilizeKeyVault.bind(this), // initialize in keyVault contract - do we need this in the SDK?
      upgradeKeyVaultImpl: this.upgradeKeyVaultImpl.bind(this), // upgradeImplementation in keyVault contract
      changeAuthenticatorKeyVault: this.changeAuthenticatorKeyVault.bind(this), // changeAuthenticator in keyVault contract
      getAccountAddressKeyVault: this.getAccountAddressKeyVault.bind(this), // getAccountAddress in keyVault contract
      getAccountAddressesKeyVault: this.getAccountAddressesKeyVault.bind(this), // getAccountAddresses in keyVault contract
      signTransactionKeyVault: this.signTransactionKeyVault.bind(this), // signTransaction in keyVault contract
      signKeyVault: this.signKeyVault.bind(this), // sign in keyVault contract
      signMessageKeyVault: this.signMessageKeyVault.bind(this), // signMessage in keyVault contract
      executeWithAuth: this.executeWithAuth.bind(this),
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
   * Get the keyVault contract address for a wallet (from wallet factory)
   * 
   * @param {Object} options - KeyVault options
   * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
   * @returns {Promise<String>} KeyVault contract address
   */
  async getWalletKeyVault(options = {}) {
    const { walletAddress } = options;
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

    try {
      const keyVaultAddr = await factory.walletKeyVault(walletAddress);
      return keyVaultAddr;
    } catch (error) {
      throw new Error(`Failed to get wallet key vault address: ${error.message}`);
    }
  }

  // /**
  //  * Get the storage contract address for a wallet (from wallet factory)
  //  * 
  //  * @param {Object} options - Storage options
  //  * @param {String} options.walletAddress - Wallet proxy address (from createWallet)
  //  * @returns {Promise<String>} Storage contract address
  //  */
  // async getWalletStorage(options = {}) {
  //   const { walletAddress } = options;
  //   if (!walletAddress || typeof walletAddress !== 'string') {
  //     throw new Error('Wallet address is required');
  //   }

  //   const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

  //   try {
  //     const storageAddr = await factory.walletStorage(walletAddress);
  //     return storageAddr;
  //   } catch (error) {
  //     throw new Error(`Failed to get wallet storage address: ${error.message}`);
  //   }
  // }

  // /**
  //  * Get the beacon address for a wallet (from wallet factory)
  //  * 
  //  * The beacon controlling WalletLogic upgrades
  //  * 
  //  * @returns {Promise<String>} Beacon address
  //  */
  // async getBeaconAddr() {

  //   const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

  //   try {
  //     const beaconAddr = await factory.beacon();
  //     return beaconAddr;
  //   } catch (error) {
  //     throw new Error(`Failed to get beacon address: ${error.message}`);
  //   }
  // }

  async getDefaultKeyVaultImplAddr() {
    const factory = getWalletFactoryContract(this.readProvider, this.addresses.factory);

    try {
      const defaultKeyVaultImpl = await factory.getDefaultKeyVaultImpl();
      return defaultKeyVaultImpl;
    } catch (error) {
      throw new Error(`Failed to get default key vault implementation: ${error.message}`);
    }
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

    if (!authenticateFor || typeof authenticateFor !== 'string') {
      throw new Error('Authenticate for is required and must be a string');
    }

    if (!signer || !(signer instanceof Wallet || signer instanceof HDNodeWallet)) {
      throw new Error('Signer must be a Wallet or HDNodeWallet');
    }

    if (!keyVault || typeof keyVault !== 'string') {
      throw new Error('Key vault is required and must be a string');
    }

    // if no authenticator contract address provided use default from config
    if (!authenticator || typeof authenticator !== 'string') {
      authenticator = this.addresses.walletSignatureAuth;
    }

    // if deadline is provided, check if it is a number and in the future
    if (deadline && (typeof deadline !== 'number' || deadline < Date.now())) {
      throw new Error('Deadline must be a number and in the future');
    } else if (!deadline) {
      // if no deadline provided, default to 1 hour from now
      deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    }

    if (chainId && (typeof chainId !== 'string')) {
      throw new Error('Chain ID must be a string');
    } else if (!chainId) {
      // if no chainId provided, default to the one in the config
      chainId = this.chainId;
    }

    const authProof = await createAuthProof(signer, chainId, authenticator, deadline, keyVault);

    return authProof;
  }

  /**
   * Add a new address to the whitelist
   * 
   * @param {Object} options - Add to whitelist options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {String} options.newAddress - New address to add to the whitelist
   * @returns {Promise<Object>} Transaction receipt
   */
  async addToWhitelist(options = {}) {
    const { keyVaultAddress, authProof, newAddress } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    // TODO: check that authProof is correct type (bytes)
    if (!authProof) {
      throw new Error('Auth proof is required');
    }

    if (!newAddress || typeof newAddress !== 'string') {
      throw new Error('New address is required');
    }

    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.writeSigner, this.addresses.walletSignatureAuth);

    try {
      const tx = await walletSigAuth.addToWhitelist(keyVaultAddress, authProof, newAddress);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse AddressAdded event
      const eventData = parseAddressAddedEvent(receipt, walletSigAuth);
      
      if (!eventData) {
        throw new Error('AddressAdded event not found in transaction receipt');
      }

      const result = {
        success: true,
        wallet: eventData.wallet,
        added: eventData.added,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      return result;
    } catch (error) {
      throw new Error(`Failed to add to whitelist: ${error.message}`);
    }
  }

  /**
   * Remove an address from the whitelist
   * 
   * @param {Object} options - Remove from whitelist options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {Bytes} options.authProof - raw password bytes (utf8 encoded string)
   * @param {String} options.addressToRemove - Address to remove from the whitelist
   * @returns {Promise<Object>} Transaction receipt
   */
  async removeFromWhitelist(options = {}) {
    const { keyVaultAddress, authProof, addressToRemove } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('Wallet address is required');
    }
  
    if (!authProof) {
      throw new Error('Auth proof is required');
    }

    if (!addressToRemove || typeof addressToRemove !== 'string') {
      throw new Error('Address is required');
    }

    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.writeSigner, this.addresses.walletSignatureAuth);

    try {
      const tx = await walletSigAuth.removeFromWhitelist(keyVaultAddress, authProof, addressToRemove);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse AddressRemoved event
      const eventData = parseAddressRemovedEvent(receipt, walletSigAuth);
      
      if (!eventData) {
        throw new Error('WhitelistRemoved event not found in transaction receipt');
      }

      const result = {
        success: true,
        wallet: eventData.wallet,
        removed: eventData.removed,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      return result;
    } catch (error) {
      throw new Error(`Failed to remove from whitelist: ${error.message}`);
    }
  }

  /**
   * Check if a wallet is configured (via walletSignatureAuthenticator contract)
   * 
   * @param {Object} options - Is configured options
   * @param {String} options.keyVaultAddress - KeyVault address of the wallet
   * @returns {Promise<Boolean>} True if wallet is configured, false otherwise
   */
  async isConfiguredWalletSigAuth(options = {}) {
    const { keyVaultAddress } = options;
    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error(' address is required');
    }

    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.readProvider, this.addresses.walletSignatureAuth);
    try {
      const isConfigured = await walletSigAuth.isConfigured(keyVaultAddress);
      return isConfigured;
    } catch (error) {
      throw new Error(`Failed to check if wallet is configured: ${error.message}`);
    }
  }

  /**
   * Check if an address is whitelisted for a wallet
   * 
   * @param {Object} options - Is whitelisted options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @param {String} options.addressToCheck - Address to check if it is whitelisted
   * @returns {Promise<Boolean>} True if address is whitelisted, false otherwise
   */
  async isWhitelisted(options = {}) {
    const { keyVaultAddress, addressToCheck } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('Wallet address is required');
    }

    if (!addressToCheck || typeof addressToCheck !== 'string') {
      throw new Error('Address to check is required');
    }

    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.readProvider, this.addresses.walletSignatureAuth);

    try {
      const isWhitelisted = await walletSigAuth.isWhitelisted(keyVaultAddress, addressToCheck);
      return isWhitelisted;
    } catch (error) {
      throw new Error(`Failed to check if address is whitelisted: ${error.message}`);
    }
  }

  /**
   * Get all whitelisted addresses for a wallet
   * 
   * @param {Object} options - Get whitelist options
   * @param {String} options.keyVaultAddress - Key vault address 
   * @returns {Promise<Array<String>>} Whitelist addresses
   */
  async getWhitelist(options = {}) {
    const { keyVaultAddress } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('Wallet address is required');
    }
    
    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.readProvider, this.addresses.walletSignatureAuth);

    try {
      const whitelist = await walletSigAuth.getWhitelist(keyVaultAddress);
      return whitelist;
    } catch (error) {
      throw new Error(`Failed to get whitelist: ${error.message}`);
    }
  }

  /**
   * Get the EIP-712 domain seperator
   * 
   * @returns {Promise<Bytes32>} EIP-712 domain seperator
   */
  async getDomainSeparator() {
    const walletSigAuth = getWalletSignatureAuthenticatorContract(this.readProvider, this.addresses.walletSignatureAuth);

    try {
      const domainSeparator = await walletSigAuth.domainSeparator();
      return domainSeparator;
    } catch (error) {
      throw new Error(`Failed to get domain separator: ${error.message}`);
    }
  }

  /**
   * Change the password of a wallet
   * 
   * @param {Object} options - Change password options
   * @param {String} options.address - KeyVault address of the wallet
   * @param {Bytes} options.currentPassword - raw password bytes (utf8 encoded string)
   * @param {Bytes32} options.newPasswordHash - New password hash (bytes32)
   * @returns {Promise<Object>} Change password result
   */
  async changePassword(options = {}) {
    const { keyVaultAddress, currentPassword, newPasswordHash } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (!currentPassword) {
      throw new Error('Current password is required');
    }

    if (!newPasswordHash) {
      throw new Error('New password hash is required');
    }

    const passwordAuth = getPasswordAuthenticatorContract(this.writeSigner, this.addresses.passwordAuth);

    try {
      const tx = await passwordAuth.changePassword(keyVaultAddress, currentPassword, newPasswordHash);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse PasswordChanged event
      const eventData = parsePasswordChangedEvent(receipt, passwordAuth);
      
      if (!eventData) {
        throw new Error('PasswordChanged event not found in transaction receipt');
      }

      const result = {
        success: true,
        walletAddress: eventData.wallet,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  /**
   * Check if a wallet is configured (via passwordAuthenticator contract)
   * 
   * @param {Object} options - Check if wallet is configured options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<Boolean>} True if wallet is configured, false otherwise
   */
  async isConfigured(options = {}) {
    const { keyVaultAddress } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    const passwordAuth = getPasswordAuthenticatorContract(this.readProvider, this.addresses.passwordAuth);

    try {
      const isConfigured = await passwordAuth.isConfigured(keyVaultAddress);
      return isConfigured;
    } catch (error) {
      throw new Error(`Failed to check if wallet is configured: ${error.message}`);
    }
  }

  /**
   * Get the storage contract address holding the keys (from keyVault contract)
   * 
   * @param {Object} options - Get storage address options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<String>} Storage contract address
   */
  async getStorageAddr(options = {}) {
    const { keyVaultAddress } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);

    try {
      const storageAddr = await keyVault.storage_();
      return storageAddr;
    } catch (error) {
      throw new Error(`Failed to get storage address: ${error.message}`);
    }
  }

  /**
   * Get the authenticator contract address for a wallet (from keyVault contract)
   * 
   * @param {Object} options - Get authenticator options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<String>} Authenticator address
   */
  async getAuthenticatorKeyVault(options = {}) {
    const { keyVaultAddress } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);
    try {
      const authenticatorAddr = await keyVault.authenticator();
      return authenticatorAddr;
    }
    catch (error) {
      throw new Error(`Failed to get authenticator address: ${error.message}`);
    }
  }

  /**
   * Get the current KeyVaultImplementation contract address (from keyVault contract)
   * 
   * @param {Object} options - Get implementation options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<String>} Implementation address
   */
  async getKeyVaultImplAddr(options = {}) {
    const { keyVaultAddress } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);

    try {
      const keyVaultImplAddr = await keyVault.implementation();
      return keyVaultImplAddr;
    }
    catch (error) {
      throw new Error(`Failed to get implementation address: ${error.message}`);
    }
  }

  /**
   * Check if a given keyVault is initialized (from keyVault contract)
   * 
   * @param {Object} options - Check if keyVault is initialized options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<Boolean>} True if keyVault is initialized, false otherwise
   */
  async isInitializedKeyVault(options = {}) {
    const { keyVaultAddress } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);
    try {
      const isInitialized = await keyVault.initialized();
      return isInitialized;
    }
    catch (error) {
      throw new Error(`Failed to check if key vault is initialized: ${error.message}`);
    }
  }

  /**
   * Upgrade the keyVaultImplementation contract address (via keyVault contract) (User-only)
   * 
   * @param {Object} options - Upgrade keyVaultImplementation options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {String} options.newImplAddr - New keyVaultImplementation contract address
   * @returns {Promise<Object>} Upgrade keyVaultImplementation result
   */
  async upgradeKeyVaultImpl(options = {}) {
    const { keyVaultAddress, authProof, newImplAddr } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (!authProof) {
      throw new Error('Auth proof is required');
    }
    if (!newImplAddr || typeof newImplAddr !== 'string') {
      throw new Error('New key vault implementation address is required');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const tx = await keyVault.upgradeImplementation(authProof, newImplAddr);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse ImplementationUpgraded event
      const eventData = parseImplementationUpgradedEvent(receipt, keyVault);
      
      if (!eventData) {
        throw new Error('ImplementationUpgraded event not found in transaction receipt');
      }

      const result = {
        success: true,
        oldImpl: eventData.oldImpl,
        newImpl: eventData.newImpl,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to upgrade key vault implementation: ${error.message}`);
    }
  }


  /**
   * Change the authenticator (via keyVault contract) (User-only)
   * 
   * @param {Object} options - Change authenticator options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {String} options.newAuthenticatorAddr - New authenticator contract address
   * @param {Bytes} options.newAuthConfig - New authentication configuration (bytes)
   * @returns {Promise<Object>} Change authenticator result
   */
  async changeAuthenticatorKeyVault(options = {}) {
    const { keyVaultAddress, authProof, newAuthenticatorAddr, newAuthConfig } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (!authProof) {
      throw new Error('Auth proof is required');
    }

    if (!newAuthenticatorAddr) {
      throw new Error('New authenticator address is required.');
    }

    if (!newAuthConfig) {
      throw new Error('New auth config is required');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const tx = await keyVault.changeAuthenticator(authProof, newAuthenticatorAddr, newAuthConfig);

      // Wait for transaction
      const receipt = await tx.wait();

      // Parse AuthenticatorChanged event
      const eventData = parseAuthenticatorChangedEvent(receipt, keyVault);

      if (!eventData) {
        throw new Error('AuthenticatorChanged event not found in transaction receipt');
      }
      const result = {
        success: true,
        oldAuth: eventData.oldAuth,
        newAuth: eventData.newAuth,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      return result;

    } catch (error) {
      throw new Error(`Failed to change authenticator in key vault: ${error.message}`);
    }
  }

  /**
   * Get one of a wallet's account addresses for a given index (from keyVault contract)
   * 
   * @param {Object} options - Get account address options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Number} options.index - Account index (uint32)
   * @returns {Promise<String>} Account address
   */
  async getAccountAddressKeyVault(options = {}) {
    const { keyVaultAddress, index } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);

    try {
      const accountAddress = await keyVault.getAccountAddress(index);
      return accountAddress;
    }
    catch (error) {
      throw new Error(`Failed to get account address: ${error.message}`);
    }
  }

  /**
   * Get multiple account addresses from a wallet for a given range of indexes (from keyVault contract)
   * 
   * @param {Object} options - Get account addresses options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Number} options.fromIndex - From index (uint32)
   * @param {Number} options.count - Count (uint32)
   * @returns {Promise<Array<String>>} Array of account addresses
   */
  async getAccountAddressesKeyVault(options = {}) {
    const { keyVaultAddress, fromIndex, count } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (fromIndex === undefined || fromIndex === null || typeof fromIndex !== 'number' || fromIndex < 0 || !Number.isInteger(fromIndex)) {
      throw new Error('From index is required and must be a non-negative integer');
    }

    if (count === undefined || count === null || typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
      throw new Error('Count is required and must be a non-negative integer');
    }

    const keyVault = getKeyVaultContract(this.readProvider, keyVaultAddress);
    
    try {
      const accountAddresses = await keyVault.getAccountAddresses(fromIndex, count);
      return accountAddresses;
    }
    catch (error) {
      throw new Error(`Failed to get account addresses: ${error.message}`);
    }
  }

  /**
   * Sign a transaction (from keyVault contract) (authenticated function)
   * 
   * @param {Object} options - Sign transaction options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {Number} options.index - Account index (uint32)
   * @param {Number} options.nonce - Nonce (uint256)
   * @param {Number} options.gasPrice - Gas price (uint256)
   * @param {Number} options.gasLimit - Gas limit (uint256)
   * @param {String} options.to - To address (address)
   * @param {Number} options.value - Value (uint256)
   * @param {Bytes} options.txData - Transaction data (bytes)
   * @param {Number} options.chainId - Chain ID (uint256)
   * @returns {Promise<Bytes>} Signed transaction (bytes)
   */
  async signTransactionKeyVault(options = {}) {
    const { keyVaultAddress, authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }
    if (!authProof) {
      throw new Error('Auth proof is required');
    }
  
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }

    if (nonce === undefined || nonce === null || typeof nonce !== 'number' || nonce < 0 || !Number.isInteger(nonce)) {
      throw new Error('Nonce is required and must be a non-negative integer');
    }

    if (!gasPrice) {
      throw new Error('Gas price is required and must be a non-negative integer');
    }

    if (!gasLimit) {
    }

    if (!to || typeof to !== 'string') {
      throw new Error('To address is required and must be a string');
    }

    if (value === undefined || value === null || typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
      throw new Error('Value is required and must be a non-negative integer');
    }

    if (!txData) {
      throw new Error('Transaction data is required');
    }

    if (chainId === undefined || chainId === null || typeof chainId !== 'number' || chainId < 0 || !Number.isInteger(chainId)) {
      throw new Error('Chain ID is required and must be a non-negative integer');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const signedTransaction = await keyVault.signTransaction(authProof, index, nonce, gasPrice, gasLimit, to, value, txData, chainId);
      return signedTransaction;
    }
    catch (error) {
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  /**
   * Sign a 32-byte hash (from keyVault contract) (authenticated function)
   * 
   * @param {Object} options - Sign hash options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {Number} options.index - Account index (uint32)
   * @param {Bytes32} options.hash - Hash to sign (bytes32)
   * @returns {Promise<Bytes>} Signed hash (bytes)
   */
  async signKeyVault(options = {}) {
    const { keyVaultAddress, authProof, index, hash } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (!authProof) {
      throw new Error('Auth proof is required');
    }
  
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }

    if (!hash) {
      throw new Error('Hash is required');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const signedHash = await keyVault.sign(authProof, index, hash);
      return signedHash;
    }
    catch (error) {
      throw new Error(`Failed to sign hash: ${error.message}`);
    }
  }

  /**
   * Sign an EIP-191 message (from keyVault contract) (authenticated function)
   * 
   * @param {Object} options - Sign message options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {Number} options.index - Account index (uint32)
   * @param {Bytes} options.message - Message to sign (bytes)
   * @returns {Promise<Bytes>} Signed message (bytes)
   */
  async signMessageKeyVault(options = {}) {
    const { keyVaultAddress, authProof, index, message } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }

    if (!authProof) {
      throw new Error('Auth proof is required');
    }
    
    if (index === undefined || index === null || typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error('Index is required and must be a non-negative integer');
    }

    if (!message) {
      throw new Error('Message is required');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const signedMessage = await keyVault.signMessage(authProof, index, message);
      return signedMessage;
    }
    catch (error) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  /**
   * Execute a function with an auth proof (from keyVault contract) (authenticated function)
   * 
   * @param {Object} options - Execute function options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @param {Bytes} options.authProof - Auth proof (bytes)
   * @param {Bytes} options.implCall - Implementation call (bytes)
   * @returns {Promise<Bytes>} Execute function result (bytes)
   */
  async executeWithAuth(options = {}) {
    const { keyVaultAddress, authProof, implCall } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
    }
    if (!authProof) {
      throw new Error('Auth proof is required');
    }
  
    if (!implCall) {
      throw new Error('Implementation call is required');
    }

    const keyVault = getKeyVaultContract(this.writeSigner, keyVaultAddress);

    try {
      const result = await keyVault.executeWithAuth(authProof, implCall);
      return result;
    }
    catch (error) {
      throw new Error(`Failed to execute function: ${error.message}`);
    }
  }
}

module.exports = Monstera;

