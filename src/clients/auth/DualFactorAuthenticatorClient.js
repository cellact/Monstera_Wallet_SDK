/**
 * Low-level client for the {@code DualFactorAuthenticator} contract.
 *
 * Combines a minute-bucket ECDSA proof (derived from the password hash via Sapphire) with a
 * guardian EIP-712 signature over {@code DualFactorAuth(wallet, actionHash, deadline)}. {@link Monstera} talks
 * to this client via {@code monstera.auth.dualFactor}.
 *
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').ConfigurePasswordDualFactorResult} ConfigurePasswordDualFactorResult
 * @typedef {import('../../types/index.js').UpdatePasswordResult} UpdatePasswordResult
 * @typedef {import('../../types/index.js').UpdateGuardianResult} UpdateGuardianResult
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../types/index.js').KeyVaultAddrOptions} KeyVaultAddrOptions
 * @typedef {import('../../types/index.js').AuthContext} AuthContext
 * @typedef {import('../../types/index.js').DualFactorClientVerifyOptions} DualFactorClientVerifyOptions
 * @typedef {import('../../types/index.js').DualFactorClientUpdatePasswordOptions} DualFactorClientUpdatePasswordOptions
 * @typedef {import('../../types/index.js').DualFactorClientConfigureOptions} DualFactorClientConfigureOptions
 * @typedef {import('../../types/index.js').DualFactorClientUpdateGuardianOptions} DualFactorClientUpdateGuardianOptions
 *
 * @module clients/auth/DualFactorAuthenticatorClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getDualFactorAuthenticatorContract } from '../../contracts/authenticators/DualFactorAuthenticator.js';
import { DualFactorAuthenticatorEvents } from '../../events/index.js';
import { requireAddress, requireNonEmptyBytes, requireBytes32, requireObject } from '../../internal/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * @public
 */
class DualFactorAuthenticatorClient extends BaseContractClient {
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
   * Check whether {@code DualFactorAuthenticator} has been configured for a wallet.
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
    log.info('DualFactorAuthenticator: isConfigured');
    log.debug('Checking if keyVault is configured', sanitizer.forLog(options));

    const dualFactorAuth = this.getReadContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);

    return this.executeRead(
      {
        operation: () => dualFactorAuth.isConfigured(keyVaultAddr),
        methodName: 'check if wallet is configured',
        ...options
      }
    );
  }

  /**
   * Verify a dual-factor proof ({@code IAuthenticator.verify}).
   *
   * @public
   * @async
   * @param {DualFactorClientVerifyOptions} options - {@code keyVaultAddr}, {@code action}, and ABI-encoded {@code authProof}
   * @returns {Promise<boolean>} {@code true} if both the minute-bucket signature and guardian EIP-712 signature verify
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid, {@code action} is missing or invalid, or {@code authProof} is not non-empty bytes
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * {@code authProof = abi.encode(bytes minutePasswordSignature, uint256 deadline, bytes guardianSignature)}.
   * {@code minutePasswordSignature} is a 65-byte ECDSA signature over the EIP-191 digest for the current minute bucket;
   * the guardian signs EIP-712 typed data with struct hash
   * {@code keccak256(abi.encode(AUTH_TYPEHASH, wallet, actionHash, deadline))}
   * and {@code deadline} must not be expired.
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof, action } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireObject(action, 'action');
    log.info('DualFactorAuthenticator: verify');
    log.debug('Verifying auth proof for keyVault', sanitizer.forLog(options));

    const dualFactorAuth = this.getReadContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);

    return this.executeRead(
      {
        operation: () => dualFactorAuth.verify(keyVaultAddr, action, authProof),
        methodName: 'verify auth proof',
        ...options
      }
    );
  }

  /**
   * Read the configured guardian address for a wallet.
   *
   * @public
   * @async
   * @param {KeyVaultAddrOptions} options - {@code keyVaultAddr}
   * @returns {Promise<Address>} Guardian address
   * @throws {ValidationError} If {@code keyVaultAddr} is missing or invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getGuardian(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('DualFactorAuthenticator: getGuardian');
    log.debug('Getting guardian for keyVault', sanitizer.forLog(options));

    const dualFactorAuth = this.getReadContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);

    return this.executeRead(
      {
        operation: () => dualFactorAuth.getGuardian(keyVaultAddr),
        methodName: 'get guardian',
        ...options
      }
    );
  }

  /**
   * Read the EIP-712 domain separator for {@code DualFactorAuthenticator}.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}] - Reserved for forwarding to error context
   * @returns {Promise<Bytes32>} 32-byte domain separator
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getDomainSeparator(options = {}) {
    log.info('DualFactorAuthenticator: getDomainSeparator');

    const dualFactorAuth = this.getReadContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);

    return this.executeRead(
      {
        operation: () => dualFactorAuth.domainSeparator(),
        methodName: 'get domain separator',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Replace the stored password hash using a dual-factor proof.
   *
   * @public
   * @async
   * @param {DualFactorClientUpdatePasswordOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newPasswordHash}
   * @returns {Promise<UpdatePasswordResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If addresses, {@code authProof} or {@code newPasswordHash} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code PasswordChanged} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updatePassword(options = {}) {
    const { keyVaultAddr, authProof, newPasswordHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireBytes32(newPasswordHash, 'newPasswordHash');
    log.info('DualFactorAuthenticator: updatePassword');
    log.debug('Updating password for keyVault', sanitizer.forLog(options));

    const dualFactorAuth = this.getWriteContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);

    return this.executeWrite(
      {
        operation: () => dualFactorAuth.changePassword(keyVaultAddr, authProof, newPasswordHash),
        methodName: 'change password dual factor',
        parseEvents: [{
          eventDef: DualFactorAuthenticatorEvents.PasswordChanged,
          contract: dualFactorAuth
        }],
        extraData: { authenticatorAddress: this.config.addresses.dualFactorAuth },
        ...options
      }
    );
  }

  /**
   * Configure the dual-factor authenticator with ABI-encoded {@code (passwordHash, guardianAddr)}.
   *
   * @public
   * @async
   * @param {DualFactorClientConfigureOptions} options - {@code keyVaultAddr} and {@code authConfig}
   * @returns {Promise<ConfigurePasswordDualFactorResult>} Standard write result with parsed {@code wallet} and {@code guardian}
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code authConfig} is not non-empty bytes
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code WalletConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authConfig, 'authConfig');
    log.info('DualFactorAuthenticator: configure');
    log.debug('Configuring password dual factor for keyVault', sanitizer.forLog(options));

    const dualFactorAuth = this.getWriteContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);
    
    return this.executeWrite(
      {
        operation: () => dualFactorAuth.configure(keyVaultAddr, authConfig),
        methodName: 'configure password dual factor',
        parseEvents: [{
          eventDef: DualFactorAuthenticatorEvents.WalletConfigured,
          contract: dualFactorAuth
        }],  
        extraData: { authenticatorAddress: this.config.addresses.dualFactorAuth },
        ...options
      }
    );
  }

  /**
   * Replace the guardian address using a dual-factor proof.
   *
   * @public
   * @async
   * @param {DualFactorClientUpdateGuardianOptions} options - {@code keyVaultAddr}, {@code authProof}, {@code newGuardian}
   * @returns {Promise<UpdateGuardianResult>} Standard write result with parsed {@code wallet} and {@code newGuardian}
   * @throws {ValidationError} If addresses or {@code authProof} are missing/invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts (e.g. invalid auth proof)
   * @throws {EventNotFoundError} If the {@code GuardianChanged} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async updateGuardian(options = {}) {
    const { keyVaultAddr, authProof, newGuardian } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(newGuardian, 'newGuardian');
    log.info('DualFactorAuthenticator: updateGuardian');
    log.debug('Updating guardian for keyVault to new address', sanitizer.forLog(options));

    const dualFactorAuth = this.getWriteContract(getDualFactorAuthenticatorContract, this.config.addresses.dualFactorAuth);
    
    return this.executeWrite(
      {
        operation: () => dualFactorAuth.changeGuardian(keyVaultAddr, authProof, newGuardian),
        methodName: 'update guardian',
        parseEvents: [{
          eventDef: DualFactorAuthenticatorEvents.GuardianChanged,
          contract: dualFactorAuth
        }],  
        extraData: { authenticatorAddress: this.config.addresses.dualFactorAuth },
        ...options
      }
    );
  }
}

export default DualFactorAuthenticatorClient;
