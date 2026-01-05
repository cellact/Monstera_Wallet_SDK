/**
 * PasswordAuthenticatorClient
 * 
 * Client for interacting with PasswordAuthenticator contract methods.
 * Handles password-based authentication and configuration.
 */

// Internal base classes
import BaseContractClient from '../../base/BaseContractClient.js';

// Internal contracts
import { getPasswordAuthenticatorContract } from '../../contracts/authenticators/PasswordAuthenticator.js';

// Internal events
import { PasswordAuthenticatorEvents } from '../../events/index.js';

// Internal utilities
import { requireAddress, requireBytes } from '../../internal/assert.js';

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
   * @param {String} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<Boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isConfigured(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');

    const passwordAuth = this.getReadContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    return this.executeRead(
      () => passwordAuth.isConfigured(keyVaultAddr),
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
   * @param {String} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authProof - The raw password bytes (utf8 encoded string)
   * @returns {Promise<Boolean>} True if password is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');

    const passwordAuth = this.getReadContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    return this.executeRead(
      () => passwordAuth.verify(keyVaultAddr, authProof),
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
   * @param {String} options.keyVaultAddr - KeyVault address of the wallet
   * @param {Bytes} options.currentPassword - Raw password bytes (utf8 encoded string)
   * @param {Bytes32} options.newPasswordHash - New password hash (bytes32)
   * @returns {Promise<Object>} Change password result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async changePassword(options = {}) {
    const { keyVaultAddr, currentPassword, newPasswordHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(currentPassword, 'currentPassword');
    requireBytes(newPasswordHash, 'newPasswordHash');

    const passwordAuth = this.getWriteContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    const result = await this.executeWrite(
      () => passwordAuth.changePassword(keyVaultAddr, currentPassword, newPasswordHash),
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
    
    // Map wallet to walletAddr for consistency with original API
    if (result.wallet) {
      result.walletAddr = result.wallet;
      delete result.wallet; // Remove wallet field to match original API
    }

    return result;
  }

  /**
   * Configure password
   * 
   * @param {Object} options - Configure password options
   * @param {String} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config is the password hash (keccak256 of password)
   * @returns {Promise<Object>} Configure wallet result
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authConfig, 'authConfig');

    const passwordAuth = this.getWriteContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);
    
    return this.executeWrite(
      () => passwordAuth.configure(keyVaultAddr, authConfig),
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

export default PasswordAuthenticatorClient;
