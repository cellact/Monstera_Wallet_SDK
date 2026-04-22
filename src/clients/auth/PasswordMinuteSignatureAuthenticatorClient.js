/**
 * PasswordMinuteSignatureAuthenticatorClient
 * 
 * Client for interacting with PasswordMinuteSignatureAuthenticator contract methods.
 * Configure with a bytes32 password hash; {@link verify} expects an ABI-encoded ECDSA
 * signature over the per-minute EIP-191 digest (not raw password bytes).
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
 * @typedef {import('../../types/index.js').PasswordMinuteSignatureAuthenticatorVerifyOptions} PasswordMinuteSignatureAuthenticatorVerifyOptions
 * @typedef {import('../../types/index.js').UpdatePasswordOptions} UpdatePasswordOptions
 * @typedef {import('../../types/index.js').PasswordMinuteSignatureAuthenticatorConfigureOptions} PasswordMinuteSignatureAuthenticatorConfigureOptions
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getPasswordMinuteSignatureAuthenticatorContract } from '../../contracts/authenticators/PasswordMinuteSignatureAuthenticator.js';
import { PasswordMinuteSignatureAuthenticatorEvents } from '../../events/index.js';
import { requireAddress, requireBytes, requireBytes32, requireUtf8Bytes } from '../../internal/assert.js';
import log from '../../internal/logger.js';

class PasswordMinuteSignatureAuthenticatorClient extends BaseContractClient {
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
    log.info('PasswordMinuteSignatureAuthenticator: isConfigured');
    log.debug('Checking if keyVault is configured', { keyVaultAddr });

    const passwordAuth = this.getReadContract(getPasswordMinuteSignatureAuthenticatorContract, this.config.addresses.passwordMinuteSignatureAuth);

    return this.executeRead(
      {
        operation: () => passwordAuth.isConfigured(keyVaultAddr),
        methodName: 'check if wallet is configured',
        ...options
      }
    );
  }

  /**
   * Verify minute-bucket ECDSA signature
   *
   * Contract expects {@code authProof = abi.encode(bytes signature)} where
   * {@code signature} is a 65-byte secp256k1 signature. The contract hashes
   * {@code keccak256(abi.encodePacked(wallet, address(this), chainId, minuteBucket))},
   * applies EIP-191, derives a deterministic signing key from
   * {@code (passwordHash, minuteBucket)} via Sapphire, and checks
   * {@code recover(digest, signature)} matches that derived address.
   *
   * @param {PasswordMinuteSignatureAuthenticatorVerifyOptions} options - Verify options
   * @returns {Promise<boolean>} True if the signature is valid for the current minute bucket
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes(authProof, 'authProof');
    log.info('PasswordMinuteSignatureAuthenticator: verify');
    log.debug('Verifying minute signature for keyVault', { keyVaultAddr }); // TODO: log the options leaving out sensitive data

    const passwordAuth = this.getReadContract(getPasswordMinuteSignatureAuthenticatorContract, this.config.addresses.passwordMinuteSignatureAuth);

    return this.executeRead(
      {
        operation: () => passwordAuth.verify(keyVaultAddr, authProof),
        methodName: 'verify minute signature',
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
    log.info('PasswordMinuteSignatureAuthenticator: updatePassword');
    log.debug('Updating password for keyVault', { keyVaultAddr }); // TODO: log the options leaving out sensitive data

    const passwordAuth = this.getWriteContract(getPasswordMinuteSignatureAuthenticatorContract, this.config.addresses.passwordMinuteSignatureAuth);

    const result = await this.executeWrite(
      {
        operation: () => passwordAuth.changePassword(keyVaultAddr, currentPassword, newPasswordHash),
        methodName: 'change password',
        parseEvents: [{
          eventDef: PasswordMinuteSignatureAuthenticatorEvents.PasswordChanged,
          contract: passwordAuth
        }],
        extraData: { authenticatorAddress: this.config.addresses.passwordMinuteSignatureAuth },
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
   * Contract stores {@code bytes32(config)}: {@code authConfig} must be exactly 32 bytes,
   * the keccak256 hash of the UTF-8 password ({@code keccak256(utf8Bytes(password))}).
   *
   * @param {PasswordMinuteSignatureAuthenticatorConfigureOptions} options - Configure password options
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
    log.info('PasswordMinuteSignatureAuthenticator: configure');
    log.debug('Configuring password for keyVault', { keyVaultAddr }); // TODO: log the options leaving out sensitive data

    const passwordAuth = this.getWriteContract(getPasswordMinuteSignatureAuthenticatorContract, this.config.addresses.passwordMinuteSignatureAuth);
    
    return this.executeWrite(
      {
        operation: () => passwordAuth.configure(keyVaultAddr, authConfig),
        methodName: 'configure password',
        parseEvents: [{
          eventDef: PasswordMinuteSignatureAuthenticatorEvents.PasswordConfigured,
          contract: passwordAuth
        }],  
        extraData: { authenticatorAddress: this.config.addresses.passwordMinuteSignatureAuth },
        ...options
      }
    );
  }
}

export default PasswordMinuteSignatureAuthenticatorClient;
