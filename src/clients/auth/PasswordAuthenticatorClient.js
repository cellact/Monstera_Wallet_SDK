/**
 * PasswordAuthenticatorClient
 * 
 * Client for interacting with PasswordAuthenticator contract methods.
 * Handles password-based authentication and configuration.
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').ConfigurePasswordResult} ConfigurePasswordResult
 * @typedef {import('../../types/index.js').UpdatePasswordResult} UpdatePasswordResult
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getPasswordAuthenticatorContract } from '../../contracts/authenticators/PasswordAuthenticator.js';
import { PasswordAuthenticatorEvents } from '../../events/index.js';
import { requireAddress, requireBytes } from '../../internal/assert.js';
import log from '../../internal/logger.js';

class PasswordAuthenticatorClient extends BaseContractClient {
  // ============================================================================
  // Constructor
  // ============================================================================
  
  /**
   * @param {EthersProvider} readProvider - Ethers provider for read operations
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped signer for write operations (null for read-only clients)
   * @param {NetworkConfig} config - Configuration object
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
   * @param {Record<string, unknown>} options - Check if wallet is configured options
   * @param {Address} options.keyVaultAddr - KeyVault contract address 
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isConfigured(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('PasswordAuthenticator: isConfigured');
    log.debug('Checking if ' + keyVaultAddr + ' is configured');

    const passwordAuth = this.getReadContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    return this.executeRead(
      {
        operation: () => passwordAuth.isConfigured(keyVaultAddr),
        methodName: 'check if wallet is configured',
        ...options
      }
    );
  }

  /**
   * Verify password
   * 
   * @param {Record<string, unknown>} options - Verify password options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authProof - The raw password bytes (utf8 encoded string)
   * @returns {Promise<boolean>} True if password is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    log.info('PasswordAuthenticator: verify');
    log.debug('Verifying password for ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 
    
    const passwordAuth = this.getReadContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    return this.executeRead(
      {
        operation: () => passwordAuth.verify(keyVaultAddr, authProof),
        methodName: 'verify password',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Update the password of a wallet
   * 
   * @param {Record<string, unknown>} options - Update password options
   * @param {Address} options.keyVaultAddr - KeyVault address of the wallet
   * @param {Bytes} options.currentPassword - Raw password bytes (utf8 encoded string)
   * @param {Bytes32} options.newPasswordHash - New password hash (bytes32)
   * @returns {Promise<UpdatePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updatePassword(options = {}) {
    const { keyVaultAddr, currentPassword, newPasswordHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(currentPassword, 'currentPassword');
    requireBytes(newPasswordHash, 'newPasswordHash');
    log.info('PasswordAuthenticator: updatePassword');
    log.debug('Updating password for ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 
    
    const passwordAuth = this.getWriteContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    const result = await this.executeWrite(
      {
        operation: () => passwordAuth.changePassword(keyVaultAddr, currentPassword, newPasswordHash),
        methodName: 'change password',
        parseEvents: [{
          eventDef: PasswordAuthenticatorEvents.PasswordChanged,
          contract: passwordAuth
        }],
        extraData: { authenticatorAddress: this.config.addresses.passwordAuth },
        ...options
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
   * @param {Record<string, unknown>} options - Configure password options
   * @param {Address} options.keyVaultAddr - KeyVault contract address
   * @param {Bytes} options.authConfig - Authentication configuration (bytes); config is the password hash (keccak256 of password)
   * @returns {Promise<ConfigurePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authConfig, 'authConfig');
    log.info('PasswordAuthenticator: configure');
    log.debug('Configuring password for: ' + keyVaultAddr); // TODO: log the options leaving out sensitive data 

    const passwordAuth = this.getWriteContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);
    
    return this.executeWrite(
      {
        operation: () => passwordAuth.configure(keyVaultAddr, authConfig),
        methodName: 'configure password',
        parseEvents: [{
          eventDef: PasswordAuthenticatorEvents.PasswordConfigured,
          contract: passwordAuth
        }],  
        extraData: { authenticatorAddress: this.config.addresses.passwordAuth },
        ...options
      }
    );
  }
}

export default PasswordAuthenticatorClient;
