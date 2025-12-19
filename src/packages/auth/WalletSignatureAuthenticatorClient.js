/**
 * WalletSignatureAuthenticatorClient
 * 
 * Client for interacting with WalletSignatureAuthenticator contract methods.
 * Handles wallet signature authentication, whitelist management, and configuration.
 */

const { getWalletSignatureAuthenticatorContract, parseAddressAddedEvent, parseAddressRemovedEvent } = require('../../contracts/authenticators/WalletSignatureAuthenticator');

class WalletSignatureAuthenticatorClient {
  constructor(readProvider, writeSigner, config) {
    this.readProvider = readProvider;
    this.writeSigner = writeSigner;
    this.config = config;
    this.addresses = config.addresses;
  }

  // TODO: add configure method and verify method

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
  async isConfigured(options = {}) {
    const { keyVaultAddress } = options;

    if (!keyVaultAddress || typeof keyVaultAddress !== 'string') {
      throw new Error('KeyVault address is required');
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
   * Get the EIP-712 domain separator
   * 
   * @returns {Promise<Bytes32>} EIP-712 domain separator
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
}

module.exports = WalletSignatureAuthenticatorClient;

