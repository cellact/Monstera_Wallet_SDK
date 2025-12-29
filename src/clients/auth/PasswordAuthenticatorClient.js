/**
 * PasswordAuthenticatorClient
 * 
 * Client for interacting with PasswordAuthenticator contract methods.
 * Handles password-based authentication and configuration.
 */

const BaseContractClient = require('../../base/BaseContractClient');
const { getPasswordAuthenticatorContract } = require('../../contracts/authenticators/PasswordAuthenticator');
const { PasswordAuthenticatorEvents } = require('../../events');
const { requireAddress, requireBytes } = require('../../internal/assert');

class PasswordAuthenticatorClient extends BaseContractClient {
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

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

    requireAddress(keyVaultAddress, 'keyVaultAddress');
    requireBytes(currentPassword, 'currentPassword');
    requireBytes(newPasswordHash, 'newPasswordHash');

    const passwordAuth = this.getWriteContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

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
   * Configure password
   * 
   * @param {Object} options - Configure password options
   * @param {String} options.keyVaultAddress - KeyVault contract address
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config is the password hash (keccak256 of password)
   * @returns {Promise<Object>} Configure wallet result
   */
  async configure(options = {}) {
    const { keyVaultAddress, authConfig } = options;

    requireAddress(keyVaultAddress, 'keyVaultAddress');
    requireBytes(authConfig, 'authConfig');

    const passwordAuth = this.getWriteContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);
    
    try {
      const result = await this.sendTx(
        () => passwordAuth.configure(keyVaultAddress, authConfig),
        {
          parseEvents: [{
            eventDef: PasswordAuthenticatorEvents.PasswordConfigured,
            contract: passwordAuth
          }]
        }
      );

      return result;
    } catch (error) {
      throw this.wrapError('configure password', error, { keyVaultAddress });
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

    requireAddress(keyVaultAddress, 'keyVaultAddress');

    const passwordAuth = this.getReadContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    try {
      const isConfigured = await passwordAuth.isConfigured(keyVaultAddress);
      return isConfigured;
    } catch (error) {
      throw this.wrapError('check if wallet is configured', error, { keyVaultAddress });
    }
  }

  /**
   * Verify password
   * 
   * @param {Object} options - Verify password options
   * @param {String} options.keyVaultAddress - KeyVault contract address
   * @param {Bytes} options.authProof - the raw password bytes (utf8 encoded string)
   * @returns {Promise<Boolean>} True if password is valid, false otherwise
   */
  async verify(options = {}) {
    const { keyVaultAddress, authProof } = options;

    requireAddress(keyVaultAddress, 'keyVaultAddress');
    requireBytes(authProof, 'authProof');

    const passwordAuth = this.getReadContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    try {
      const isValid = await passwordAuth.verify(keyVaultAddress, authProof);
      return isValid;
    } catch (error) {
      throw this.wrapError('verify password', error, { keyVaultAddress });
    }
  }
}

module.exports = PasswordAuthenticatorClient;
