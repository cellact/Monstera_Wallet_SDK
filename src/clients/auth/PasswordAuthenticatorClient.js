/**
 * Low-level client for the {@code PasswordAuthenticator} contract.
 *
 * Stores a {@code keccak256(utf8(password))} hash on-chain and verifies raw UTF-8 password
 * buffers against it. {@code Monstera} talks to this client via {@code monstera.auth.password}.
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
 * @typedef {import('../../types/index.js').PasswordClientVerifyOptions} PasswordClientVerifyOptions
 * @typedef {import('../../types/index.js').UpdatePasswordOptions} UpdatePasswordOptions
 * @typedef {import('../../types/index.js').PasswordClientConfigureOptions} PasswordClientConfigureOptions
 *
 * @module clients/auth/PasswordAuthenticatorClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getPasswordAuthenticatorContract } from '../../contracts/authenticators/PasswordAuthenticator.js';
import { PasswordAuthenticatorEvents } from '../../events/index.js';
import { requireAddress, requireBytes, requireBytes32, requireUtf8Bytes } from '../../internal/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * @public
 */
class PasswordAuthenticatorClient extends BaseContractClient {
  /**
   * Forward provider/signer/config to {@link BaseContractClient}.
   *
   * @public
   * @param {EthersProvider} readProvider - Read provider for view calls
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped write signer ({@code null} for read-only)
   * @param {NetworkConfig} config - Resolved network configuration
   */
  constructor(readProvider, writeSigner, config) {
    super(readProvider, writeSigner, config);
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Check whether the {@code PasswordAuthenticator} has been configured for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<boolean>} {@code true} if configured
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isConfigured(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('PasswordAuthenticator: isConfigured');
    log.debug('Checking if keyVault is configured', sanitizer.forLog(options));

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
   * Verify a raw UTF-8 password buffer against the stored hash.
   *
   * @public
   * @async
   * @param {PasswordClientVerifyOptions} options - {@code keyVaultAddr} and {@code authProof} (UTF-8 password bytes)
   * @returns {Promise<boolean>} {@code true} if the password matches
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code authProof} is not a non-empty Uint8Array
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireUtf8Bytes(authProof, 'authProof');
    log.info('PasswordAuthenticator: verify');
    log.debug('Verifying password for keyVault', sanitizer.forLog(options));

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
   * Replace the stored password hash. Caller must supply the current UTF-8 password buffer.
   *
   * @public
   * @async
   * @param {UpdatePasswordOptions} options - {@code keyVaultAddr}, {@code currentPassword} (UTF-8 {@link Uint8Array}), {@code newPasswordHash}
   * @returns {Promise<UpdatePasswordResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If addresses, {@code currentPassword} or {@code newPasswordHash} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. wrong current password)
   * @throws {EventNotFoundError} If the {@code PasswordChanged} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updatePassword(options = {}) {
    const { keyVaultAddr, currentPassword, newPasswordHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireUtf8Bytes(currentPassword, 'currentPassword');
    requireBytes32(newPasswordHash, 'newPasswordHash');
    log.info('PasswordAuthenticator: updatePassword');
    log.debug('Updating password for keyVault', sanitizer.forLog(options));

    const passwordAuth = this.getWriteContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    return this.executeWrite(
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
  }

  /**
   * Configure the password hash on the authenticator ({@code IAuthenticator.configure}).
   *
   * @public
   * @async
   * @param {PasswordClientConfigureOptions} options - {@code keyVaultAddr} and 32-byte {@code authConfig} (password hash)
   * @returns {Promise<ConfigurePasswordResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code authConfig} is not exactly 32 bytes
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code PasswordConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Contract stores {@code bytes32(config)}: {@code authConfig} must be exactly 32 bytes
   * ({@code keccak256} of UTF-8 password bytes).
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes32(authConfig, 'authConfig');
    log.info('PasswordAuthenticator: configure');
    log.debug('Configuring password for keyVault', sanitizer.forLog(options));

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
