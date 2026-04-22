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
 * @typedef {import('../../types/index.js').KeyVaultAddrOptions} KeyVaultAddrOptions
 * @typedef {import('../../types/index.js').PasswordAuthenticatorVerifyOptions} PasswordAuthenticatorVerifyOptions
 * @typedef {import('../../types/index.js').UpdatePasswordOptions} UpdatePasswordOptions
 * @typedef {import('../../types/index.js').PasswordAuthenticatorConfigureOptions} PasswordAuthenticatorConfigureOptions
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getPasswordAuthenticatorContract } from '../../contracts/authenticators/PasswordAuthenticator.js';
import { PasswordAuthenticatorEvents } from '../../events/index.js';
import { requireAddress, requireBytes, requireBytes32, requireUtf8Bytes } from '../../internal/assert.js';
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
   * @param {KeyVaultAddrOptions} options - Check if wallet is configured options
   * @returns {Promise<boolean>} True if wallet is configured, false otherwise
   * @throws {ValidationError} If keyVaultAddr is missing or invalid
   */
  async isConfigured(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('PasswordAuthenticator: isConfigured');
    log.debug('Checking if keyVault is configured', { keyVaultAddr });

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
   * Verify password using valid password auth proof
   * 
   * @param {PasswordAuthenticatorVerifyOptions} options - Verify password options
   * @returns {Promise<boolean>} True if password is valid, false otherwise
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireUtf8Bytes(authProof, 'authProof');
    log.info('PasswordAuthenticator: verify');
    log.debug('Verifying password for keyVault', { keyVaultAddr }); // TODO: log the options leaving out sensitive data

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
   * @param {UpdatePasswordOptions} options - Update password options
   * @returns {Promise<UpdatePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async updatePassword(options = {}) {
    const { keyVaultAddr, currentPassword, newPasswordHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireUtf8Bytes(currentPassword, 'currentPassword');
    requireBytes32(newPasswordHash, 'newPasswordHash');
    log.info('PasswordAuthenticator: updatePassword');
    log.debug('Updating password for keyVault', { keyVaultAddr }); // TODO: log the options leaving out sensitive data

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
   * Configure password hash (IAuthenticator.configure).
   *
   * Contract stores {@code bytes32(config)}: {@code authConfig} must be exactly 32 bytes
   * ({@code keccak256} of UTF-8 password bytes).
   *
   * @param {PasswordAuthenticatorConfigureOptions} options - Configure password options
   * @returns {Promise<ConfigurePasswordResult>}
   * @throws {ValidationError} If required parameters are missing or invalid
   * @throws {WriteRequiresSignerError} If writeSigner is not available
   * @throws {ContractRevertError} If transaction reverts
   * @throws {EventNotFoundError} If expected event is not found in receipt
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes32(authConfig, 'authConfig');
    log.info('PasswordAuthenticator: configure');
    log.debug('Configuring password for keyVault', { keyVaultAddr }); // TODO: log the options leaving out sensitive data

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
