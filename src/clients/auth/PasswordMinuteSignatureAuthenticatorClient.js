/**
 * Low-level client for the {@code PasswordMinuteSignatureAuthenticator} contract.
 *
 * Stores a {@code keccak256(utf8(password))} hash on-chain and verifies an ABI-encoded ECDSA
 * signature over the per-minute EIP-191 digest. {@link Monstera} talks to this client via
 * {@code monstera.auth.passwordMinuteSignature}.
 *
 * @module clients/auth/PasswordMinuteSignatureAuthenticatorClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getPasswordMinuteSignatureAuthenticatorContract } from '../../contracts/authenticators/PasswordMinuteSignatureAuthenticator.js';
import { PasswordMinuteSignatureAuthenticatorEvents } from '../../events/index.js';
import { requireAddress, requireBytes32, requireNonEmptyBytes, requireNonEmptyObject } from '../../internal/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * @public
 */
class PasswordMinuteSignatureAuthenticatorClient extends BaseContractClient {
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
   * Check whether {@code PasswordMinuteSignatureAuthenticator} has been configured for a wallet.
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
    log.info('PasswordMinuteSignatureAuthenticator: isConfigured');
    log.debug('Checking if keyVault is configured', sanitizer.forLog(options));

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
   * Verify a minute-bucket ECDSA signature bound to an action.
   *
   * @public
   * @async
   * @param {PasswordMinuteClientVerifyOptions} options - {@code keyVaultAddr}, {@code action}, and ABI-encoded {@code authProof}
   * @returns {Promise<boolean>} {@code true} if the signature is valid for the current minute bucket and action
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid, {@code action} is missing, or {@code authProof} is not non-empty bytes
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * Contract expects {@code authProof = abi.encode(bytes signature)} where {@code signature} is a
   * 65-byte secp256k1 signature. The contract hashes
   * {@code keccak256(abi.encodePacked(wallet, address(this), chainId, minuteBucket, actionHash))},
   * applies EIP-191, derives a deterministic signing key from {@code (passwordHash, minuteBucket)} via
   * Sapphire, and checks {@code recover(digest, signature)} matches that derived address.
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof, action } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonEmptyObject(action, 'action');
    log.info('PasswordMinuteSignatureAuthenticator: verify');
    log.debug('Verifying minute signature for keyVault', sanitizer.forLog(options));

    const passwordAuth = this.getReadContract(getPasswordMinuteSignatureAuthenticatorContract, this.config.addresses.passwordMinuteSignatureAuth);

    return this.executeRead(
      {
        operation: () => passwordAuth.verify(keyVaultAddr, action, authProof),
        methodName: 'verify minute signature',
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
    log.info('PasswordMinuteSignatureAuthenticator: updatePassword');
    log.debug('Updating password for keyVault', sanitizer.forLog(options));

    const passwordAuth = this.getWriteContract(getPasswordMinuteSignatureAuthenticatorContract, this.config.addresses.passwordMinuteSignatureAuth);

    return this.executeWrite(
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
  }

  /**
   * Configure the password hash on the authenticator ({@code IAuthenticator.configure}).
   *
   * @public
   * @async
   * @param {PasswordMinuteClientConfigureOptions} options - {@code keyVaultAddr} and 32-byte {@code authConfig} (password hash)
   * @returns {Promise<ConfigurePasswordResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code authConfig} is not exactly 32 bytes
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code PasswordConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks Contract stores {@code bytes32(config)}: {@code authConfig} must be exactly 32 bytes,
   * the keccak256 hash of the UTF-8 password ({@code keccak256(utf8Bytes(password))}).
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes32(authConfig, 'authConfig');
    log.info('PasswordMinuteSignatureAuthenticator: configure');
    log.debug('Configuring password for keyVault', sanitizer.forLog(options));

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
