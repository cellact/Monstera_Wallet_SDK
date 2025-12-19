/**
 * PasswordAuthenticatorClient
 * 
 * Client for interacting with PasswordAuthenticator contract methods.
 * Handles password-based authentication and configuration.
 */

const { getPasswordAuthenticatorContract, parsePasswordChangedEvent } = require('../../contracts/authenticators/PasswordAuthenticator');

class PasswordAuthenticatorClient {
  constructor(readProvider, writeSigner, config) {
    this.readProvider = readProvider;
    this.writeSigner = writeSigner;
    this.config = config;
    this.addresses = config.addresses;
  }

  // TODO: add configure method and verify method

  /**
   * Change the password of a wallet
   * 
   * @param {Object} options - Change password options
   * @param {String} options.keyVaultAddress - KeyVault address of the wallet
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
   * Check if a wallet is configured
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
}

module.exports = PasswordAuthenticatorClient;

