/**
 * PasswordAuthenticatorClient
 * 
 * Client for interacting with PasswordAuthenticator contract methods.
 * Handles password-based authentication and configuration.
 */

// Internal base classes
const BaseContractClient = require('../../base/BaseContractClient');

// Internal contracts
const { getPasswordAuthenticatorContract } = require('../../contracts/authenticators/PasswordAuthenticator');

// Internal events
const { PasswordAuthenticatorEvents } = require('../../events');

// Internal utilities
const { requireAddress, requireBytes } = require('../../internal/assert');

class PasswordAuthenticatorClient extends BaseContractClient {
  // ============================================================================
  // Constructor
  // ============================================================================
  
  /**
   * @param {Object} readProvider - Ethers provider for read operations
   * @param {Object} writeSigner - Ethers signer for write operations
   * @param {Object} config - Configuration object
   */
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Check if a wallet is configured
   * 
   * @param {Object} options - Check if wallet is configured options
   * @param {String} options.keyVaultAddress - KeyVault contract address 
   * @returns {Promise<Boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddress is missing or invalid
   */
  async isConfigured(options = {}) {
    const { keyVaultAddress } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');

    const passwordAuth = this.getReadContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    return this.executeRead(
      () => passwordAuth.isConfigured(keyVaultAddress),
      'check if wallet is configured',
      {
        ...options,
        authenticatorAddress: this.config.addresses.passwordAuth
      }
    );
  }

  /**
   * Verify password
   * 
   * @param {Object} options - Verify password options
   * @param {String} options.keyVaultAddress - KeyVault contract address
   * @param {Bytes} options.authProof - The raw password bytes (utf8 encoded string)
   * @returns {Promise<Boolean>} True if password is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async verify(options = {}) {
    const { keyVaultAddress, authProof } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');
    requireBytes(authProof, 'authProof');

    const passwordAuth = this.getReadContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    return this.executeRead(
      () => passwordAuth.verify(keyVaultAddress, authProof),
      'verify password',
      {
        ...options,
        authenticatorAddress: this.config.addresses.passwordAuth
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Change the password of a wallet
   * 
   * @param {Object} options - Change password options
   * @param {String} options.keyVaultAddress - KeyVault address of the wallet
   * @param {Bytes} options.currentPassword - Raw password bytes (utf8 encoded string)
   * @param {Bytes32} options.newPasswordHash - New password hash (bytes32)
   * @returns {Promise<Object>} Change password result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async changePassword(options = {}) {
    const { keyVaultAddress, currentPassword, newPasswordHash } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');
    requireBytes(currentPassword, 'currentPassword');
    requireBytes(newPasswordHash, 'newPasswordHash');

    const passwordAuth = this.getWriteContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    const result = await this.executeWrite(
      () => passwordAuth.changePassword(keyVaultAddress, currentPassword, newPasswordHash),
      'change password',
      {
        ...options,
        parseEvents: [{
          eventDef: PasswordAuthenticatorEvents.PasswordChanged,
          contract: passwordAuth
        }],
        authenticatorAddress: this.config.addresses.passwordAuth
      }
    );
    
    // Map wallet to walletAddress for consistency with original API
    if (result.wallet) {
      result.walletAddress = result.wallet;
      delete result.wallet; // Remove wallet field to match original API
    }

    return result;
  }

  /**
   * Configure password
   * 
   * @param {Object} options - Configure password options
   * @param {String} options.keyVaultAddress - KeyVault contract address
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config is the password hash (keccak256 of password)
   * @returns {Promise<Object>} Configure wallet result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configure(options = {}) {
    const { keyVaultAddress, authConfig } = options;
    requireAddress(keyVaultAddress, 'keyVaultAddress');
    requireBytes(authConfig, 'authConfig');

    const passwordAuth = this.getWriteContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);
    
    return this.executeWrite(
      () => passwordAuth.configure(keyVaultAddress, authConfig),
      'configure password',
      {
        ...options,
        parseEvents: [{
          eventDef: PasswordAuthenticatorEvents.PasswordConfigured,
          contract: passwordAuth
        }],
        authenticatorAddress: this.config.addresses.passwordAuth
      }
    );
  }

}

module.exports = PasswordAuthenticatorClient;
