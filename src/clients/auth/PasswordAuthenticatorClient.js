/**
 * PasswordAuthenticatorClient
 * 
 * Client for interacting with PasswordAuthenticator contract methods.
 * Handles password-based authentication and configuration.
 */

const BaseContractClient = require('../../internal/BaseContractClient');
const { getPasswordAuthenticatorContract } = require('../../contracts/authenticators/PasswordAuthenticator');
const { PasswordAuthenticatorEvents } = require('../../events');

class PasswordAuthenticatorClient extends BaseContractClient {
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
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

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');
    this.requireBytes(currentPassword, 'currentPassword');
    this.requireBytes(newPasswordHash, 'newPasswordHash');

    const passwordAuth = this.contract('write', getPasswordAuthenticatorContract, this.addresses.passwordAuth);

    try {
      const result = await this.sendTx(
        () => passwordAuth.changePassword(keyVaultAddress, currentPassword, newPasswordHash),
        {
          parseEvents: [{
            eventDef: PasswordAuthenticatorEvents.PasswordChanged,
            contract: passwordAuth
          }]
        }
      );
      
      // Map wallet to walletAddress for consistency with original API
      if (result.wallet) {
        result.walletAddress = result.wallet;
        delete result.wallet; // Remove wallet field to match original API
      }

      return result;
    } catch (error) {
      throw this.wrapError('change password', error, { keyVaultAddress });
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

    this.requireAddress(keyVaultAddress, 'keyVaultAddress');

    const passwordAuth = this.contract('read', getPasswordAuthenticatorContract, this.addresses.passwordAuth);

    try {
      const isConfigured = await passwordAuth.isConfigured(keyVaultAddress);
      return isConfigured;
    } catch (error) {
      throw this.wrapError('check if wallet is configured', error, { keyVaultAddress });
    }
  }
}

module.exports = PasswordAuthenticatorClient;

