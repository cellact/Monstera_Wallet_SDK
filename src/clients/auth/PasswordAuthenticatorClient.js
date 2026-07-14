/**
 * Low-level client for the {@code PasswordAuthenticator} contract.
 *
 * Stores a {@code keccak256(utf8(password))} hash on-chain and verifies action-bound proofs of the
 * form {@code abi.encode(bytes password, bytes32 actionHash)}. {@link Monstera} talks to this
 * client via {@code monstera.auth.password}.
 *
 * @module clients/auth/PasswordAuthenticatorClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getPasswordAuthenticatorContract } from '../../contracts/authenticators/PasswordAuthenticator.js';
import { PasswordAuthenticatorEvents } from '../../events/index.js';
import { requireAddress, requireBytes32, requireNonEmptyBytes, requireNonEmptyObject } from '../../internal/validation/assert.js';
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
   * Verify an action-bound password proof ({@code IAuthenticator.verify}).
   *
   * @public
   * @async
   * @param {PasswordClientVerifyOptions} options - {@code keyVaultAddr}, {@code action}, and ABI-encoded {@code authProof}
   * @returns {Promise<boolean>} {@code true} if the password matches and {@code actionHash} binds
   * @throws {ValidationError} If inputs are missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * {@code authProof = abi.encode(bytes password, bytes32 actionHash)}.
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof, action } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonEmptyObject(action, 'action');
    log.info('PasswordAuthenticator: verify');
    log.debug('Verifying password for keyVault', sanitizer.forLog(options));

    const passwordAuth = this.getReadContract(getPasswordAuthenticatorContract, this.config.addresses.passwordAuth);

    return this.executeRead(
      {
        operation: () => passwordAuth.verify(keyVaultAddr, action, authProof),
        methodName: 'verify password',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Replace the stored password hash. Caller must supply the current action-bound password proof.
   *
   * @public
   * @async
   * @param {UpdatePasswordOptions} options - {@code keyVaultAddr}, encoded {@code currentPassword}, {@code newPasswordHash}
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
    requireNonEmptyBytes(currentPassword, 'currentPassword');
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
