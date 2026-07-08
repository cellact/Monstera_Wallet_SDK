/**
 * Low-level client for the {@code MultiAuthenticator} contract.
 *
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').ConfigureMultiAuthenticatorResult} ConfigureMultiAuthenticatorResult
 * @typedef {import('../../types/index.js').AddMultiAuthenticatorResult} AddMultiAuthenticatorResult
 * @typedef {import('../../types/index.js').RemoveMultiAuthenticatorResult} RemoveMultiAuthenticatorResult
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../types/index.js').KeyVaultAddrOptions} KeyVaultAddrOptions
 * @typedef {import('../../types/index.js').MultiAuthenticatorClientVerifyOptions} MultiAuthenticatorClientVerifyOptions
 * @typedef {import('../../types/index.js').MultiAuthenticatorClientConfigureOptions} MultiAuthenticatorClientConfigureOptions
 * @typedef {import('../../types/index.js').MultiAuthenticatorClientAddAuthenticatorOptions} MultiAuthenticatorClientAddAuthenticatorOptions
 * @typedef {import('../../types/index.js').MultiAuthenticatorClientRemoveAuthenticatorOptions} MultiAuthenticatorClientRemoveAuthenticatorOptions
 * @typedef {import('../../types/index.js').MultiAuthenticatorClientIsEnabledOptions} MultiAuthenticatorClientIsEnabledOptions
 * @typedef {import('../../types/index.js').MultiAuthenticatorClientGetAuthenticatorsOptions} MultiAuthenticatorClientGetAuthenticatorsOptions
 * @typedef {import('../../types/index.js').MultiAuthenticatorClientComputeActionHashOptions} MultiAuthenticatorClientComputeActionHashOptions
 *
 * @module clients/auth/MultiAuthenticatorClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getMultiAuthenticatorContract } from '../../contracts/authenticators/MultiAuthenticator.js';
import { MultiAuthenticatorEvents } from '../../events/index.js';
import {
  requireAddress,
  requireNonEmptyBytes,
  requireBytes32,
  requireNonEmptyObject,
  requireBytes4
} from '../../internal/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * @public
 */
class MultiAuthenticatorClient extends BaseContractClient {
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
   * Check whether {@code MultiAuthenticator} has been configured for a wallet.
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
    log.info('MultiAuthenticator: isConfigured');
    log.debug('Checking if keyVault is configured', sanitizer.forLog(options));

    const multiAuthenticator = this.getReadContract(getMultiAuthenticatorContract, this.config.addresses.multiAuthenticator);

    return this.executeRead(
      {
        operation: () => multiAuthenticator.isConfigured(keyVaultAddr),
        methodName: 'check if wallet is configured',
        ...options
      }
    );
  }

  /**
   * Verify a routed child proof ({@code IAuthenticator.verify}).
   *
   * @public
   * @async
   * @param {MultiAuthenticatorClientVerifyOptions} options - {@code keyVaultAddr}, {@code action}, and ABI-encoded {@code authProof}
   * @returns {Promise<boolean>} {@code true} if the routed child proof verifies for the given context
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid, {@code action} is missing or invalid, or {@code authProof} is not non-empty bytes
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * {@code authProof = abi.encode(address child, bytes childProof)}.
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof, action } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonEmptyObject(action, 'action');
    log.info('MultiAuthenticator: verify');
    log.debug('Verifying auth proof for keyVault', sanitizer.forLog(options));

    const multiAuthenticator = this.getReadContract(getMultiAuthenticatorContract, this.config.addresses.multiAuthenticator);

    return this.executeRead(
      {
        operation: () => multiAuthenticator.verify(keyVaultAddr, action, authProof),
        methodName: 'verify auth proof',
        ...options
      }
    );
  }

  /**
   * Check whether a child authenticator is enabled for a wallet.
   *
   * @public
   * @async
   * @param {MultiAuthenticatorClientIsEnabledOptions} options - {@code keyVaultAddr} and {@code child}
   * @returns {Promise<boolean>} {@code true} if the child is enabled
   * @throws {ValidationError} If {@code keyVaultAddr} or {@code child} is invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async isEnabled(options = {}) {
    const { keyVaultAddr, child } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireAddress(child, 'child');
    log.info('MultiAuthenticator: isEnabled');
    log.debug('Checking if child is enabled for keyVault', sanitizer.forLog(options));

    const multiAuthenticator = this.getReadContract(getMultiAuthenticatorContract, this.config.addresses.multiAuthenticator);

    return this.executeRead(
      {
        operation: () => multiAuthenticator.isEnabled(keyVaultAddr, child),
        methodName: 'check if child is enabled',
        ...options
      }
    );
  }

  /**
   * Get the list of enabled child authenticators for a wallet.
   *
   * @public
   * @async
   * @param {MultiAuthenticatorClientGetAuthenticatorsOptions} options - {@code keyVaultAddr}
   * @returns {Promise<address[]>} List of enabled child authenticators
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async getAuthenticators(options = {}) {
    const { keyVaultAddr } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    log.info('MultiAuthenticator: getAuthenticators');
    log.debug('Getting authenticators for keyVault', sanitizer.forLog(options));

    const multiAuthenticator = this.getReadContract(getMultiAuthenticatorContract, this.config.addresses.multiAuthenticator);

    return this.executeRead(
      {
        operation: () => multiAuthenticator.getAuthenticators(keyVaultAddr),
        methodName: 'get authenticators',
        ...options
      }
    );
  }

  /**
   * Compute the hash of an action for a wallet.
   *
   * @public
   * @async
   * @param {MultiAuthenticatorClientComputeActionHashOptions} options - {@code keyVaultAddr}, {@code selector}, and {@code paramsHash}
   * @returns {Promise<Bytes32>} Hash of the action
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid, {@code selector} is invalid, or {@code paramsHash} is invalid
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   */
  async computeActionHash(options = {}) {
    const { keyVaultAddr, selector, paramsHash } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes4(selector, 'selector');
    requireBytes32(paramsHash, 'paramsHash');
    log.info('MultiAuthenticator: computeActionHash');
    log.debug('Computing action hash for keyVault', sanitizer.forLog(options));

    const multiAuthenticator = this.getReadContract(getMultiAuthenticatorContract, this.config.addresses.multiAuthenticator);

    return this.executeRead(
      {
        operation: () => multiAuthenticator.computeActionHash(keyVaultAddr, selector, paramsHash),
        methodName: 'compute action hash',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Configure a wallet with ABI-encoded multi-authenticator config bytes.
   *
   * @public
   * @async
   * @param {MultiAuthenticatorClientConfigureOptions} options - {@code keyVaultAddr} and {@code authConfig}
   * @returns {Promise<ConfigureMultiAuthenticatorResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code authConfig} is not non-empty bytes
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code WalletConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * {@code authConfig = abi.encode(address[] children, bytes[] childConfigs)}.
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authConfig, 'authConfig');
    log.info('MultiAuthenticator: configure');
    log.debug('Configuring multi authenticator for keyVault', sanitizer.forLog(options));

    const multiAuthenticator = this.getWriteContract(getMultiAuthenticatorContract, this.config.addresses.multiAuthenticator);

    return this.executeWrite(
      {
        operation: () => multiAuthenticator.configure(keyVaultAddr, authConfig),
        methodName: 'configure multi authenticator',
        parseEvents: [{
          eventDef: MultiAuthenticatorEvents.WalletConfigured,
          contract: multiAuthenticator
        }],
        extraData: { authenticatorAddress: this.config.addresses.multiAuthenticator },
        ...options
      }
    );
  }

  /**
   * Enable an additional child authenticator for a wallet.
   *
   * @public
   * @async
   * @param {MultiAuthenticatorClientAddAuthenticatorOptions} options - {@code keyVaultAddr}, routed {@code authProof}, {@code child}, and {@code childConfig}
   * @returns {Promise<AddMultiAuthenticatorResult>} Standard write result with parsed {@code wallet} and {@code child}
   * @throws {ValidationError} If inputs are missing or invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code AuthenticatorAdded} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * {@code authProof = abi.encode(address viaChild, bytes childProof)} for a currently enabled child.
   */
  async addAuthenticator(options = {}) {
    const { keyVaultAddr, authProof, child, childConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(child, 'child');
    requireNonEmptyBytes(childConfig, 'childConfig');
    log.info('MultiAuthenticator: addAuthenticator');
    log.debug('Adding authenticator for keyVault', sanitizer.forLog(options));

    const multiAuthenticator = this.getWriteContract(getMultiAuthenticatorContract, this.config.addresses.multiAuthenticator);

    return this.executeWrite(
      {
        operation: () => multiAuthenticator.addAuthenticator(keyVaultAddr, authProof, child, childConfig),
        methodName: 'add authenticator',
        parseEvents: [{
          eventDef: MultiAuthenticatorEvents.AuthenticatorAdded,
          contract: multiAuthenticator
        }],
        extraData: { authenticatorAddress: this.config.addresses.multiAuthenticator },
        ...options
      }
    );
  }

  /**
   * Disable a child authenticator for a wallet.
   *
   * @public
   * @async
   * @param {MultiAuthenticatorClientRemoveAuthenticatorOptions} options - {@code keyVaultAddr}, routed {@code authProof}, and {@code child}
   * @returns {Promise<RemoveMultiAuthenticatorResult>} Standard write result with parsed {@code wallet} and {@code child}
   * @throws {ValidationError} If inputs are missing or invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code AuthenticatorRemoved} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   */
  async removeAuthenticator(options = {}) {
    const { keyVaultAddr, authProof, child } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireAddress(child, 'child');
    log.info('MultiAuthenticator: removeAuthenticator');
    log.debug('Removing authenticator for keyVault', sanitizer.forLog(options));

    const multiAuthenticator = this.getWriteContract(getMultiAuthenticatorContract, this.config.addresses.multiAuthenticator);

    return this.executeWrite(
      {
        operation: () => multiAuthenticator.removeAuthenticator(keyVaultAddr, authProof, child),
        methodName: 'remove authenticator',
        parseEvents: [{
          eventDef: MultiAuthenticatorEvents.AuthenticatorRemoved,
          contract: multiAuthenticator
        }],
        extraData: { authenticatorAddress: this.config.addresses.multiAuthenticator },
        ...options
      }
    );
  }
}

export default MultiAuthenticatorClient;
