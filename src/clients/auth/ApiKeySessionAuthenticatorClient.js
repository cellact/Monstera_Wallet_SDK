/**
 * Low-level client for the {@code ApiKeySessionAuthenticator} contract.
 *
 * @module clients/auth/ApiKeySessionAuthenticatorClient
 */

import BaseContractClient from '../../base/BaseContractClient.js';
import { getApiKeySessionAuthenticatorContract } from '../../contracts/authenticators/ApiKeySessionAuthenticator.js';
import { ApiKeySessionAuthenticatorEvents } from '../../events/index.js';
import {
  requireAddress,
  requireNonEmptyBytes,
  requireBytes32,
  requireNonEmptyObject,
  requireChainId,
  requireNumber,
  requireBytes4
} from '../../internal/validation/assert.js';
import log from '../../internal/logger.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * @public
 */
class ApiKeySessionAuthenticatorClient extends BaseContractClient {
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
   * Check whether {@code ApiKeySessionAuthenticator} has been configured for a wallet.
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
    log.debug('Checking if keyVault is configured', sanitizer.forLog(options));

    const apiKeySessionAuth = this.getReadContract(getApiKeySessionAuthenticatorContract, this.config.addresses.apiKeySessionAuth);

    return this.executeRead(
      {
        operation: () => apiKeySessionAuth.isConfigured(keyVaultAddr),
        methodName: 'check if wallet is configured',
        ...options
      }
    );
  }

  /**
   * Verify an API key session proof ({@code IAuthenticator.verify}).
   *
   * @public
   * @async
   * @param {ApiKeySessionClientVerifyOptions} options - {@code keyVaultAddr}, {@code action}, and ABI-encoded {@code authProof}
   * @returns {Promise<boolean>} {@code true} if the token or action MAC verifies for the given context
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid, {@code action} is missing or invalid, or {@code authProof} is not non-empty bytes
   * @throws {NetworkError} If the read call fails over RPC
   * @throws {ContractRevertError} If the underlying call reverts
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * {@code authProof = abi.encode(uint8 mode, bytes modeProof)}.
   * TOKEN mode ({@code mode = 1}): {@code modeProof = abi.encode(uint256 expiry, uint256 scopeMask, bytes32 mac)}.
   * ACTION mode ({@code mode = 2}): {@code modeProof = abi.encode(bytes32 mac)}.
   */
  async verify(options = {}) {
    const { keyVaultAddr, authProof, action } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireNonEmptyObject(action, 'action');
    log.debug('Verifying auth proof for keyVault', sanitizer.forLog(options));

    const apiKeySessionAuth = this.getReadContract(getApiKeySessionAuthenticatorContract, this.config.addresses.apiKeySessionAuth);

    return this.executeRead(
      {
        operation: () => apiKeySessionAuth.verify(keyVaultAddr, action, authProof),
        methodName: 'verify auth proof',
        ...options
      }
    );
  }

  /**
   * Recompute a TOKEN-mode MAC ({@code computeTokenMac} on-chain helper).
   *
   * @public
   * @async
   * @param {ApiKeySessionClientComputeTokenMacOptions} options - {@code keyVaultAddr}, {@code apiKeySecret}, {@code chainId}, {@code expiry}, {@code scopeMask}
   * @returns {Promise<Bytes32>} Token MAC
   */
  async computeTokenMac(options = {}) {
    const { keyVaultAddr, apiKeySecret, chainId, expiry, scopeMask } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireBytes32(apiKeySecret, 'apiKeySecret');
    const normalizedChainId = requireChainId(chainId, 'chainId');
    requireNumber(expiry, 'expiry', { allowNegative: false });
    requireNumber(scopeMask, 'scopeMask', { allowNegative: false });
    log.debug('Computing token MAC for keyVault', sanitizer.forLog(options));

    const apiKeySessionAuth = this.getReadContract(getApiKeySessionAuthenticatorContract, this.config.addresses.apiKeySessionAuth);

    return this.executeRead(
      {
        operation: () => apiKeySessionAuth.computeTokenMac(apiKeySecret, normalizedChainId, keyVaultAddr, expiry, scopeMask),
        methodName: 'compute token MAC',
        ...options
      }
    );
  }

  /**
   * Recompute an ACTION-mode MAC ({@code computeActionMac} on-chain helper).
   *
   * @public
   * @async
   * @param {ApiKeySessionClientComputeActionMacOptions} options - {@code apiKeySecret} and {@code actionHash}
   * @returns {Promise<Bytes32>} Action MAC
   */
  async computeActionMac(options = {}) {
    const { apiKeySecret, actionHash } = options;
    requireBytes32(apiKeySecret, 'apiKeySecret');
    requireBytes32(actionHash, 'actionHash');
    log.debug('Computing action MAC', sanitizer.forLog(options));

    const apiKeySessionAuth = this.getReadContract(getApiKeySessionAuthenticatorContract, this.config.addresses.apiKeySessionAuth);

    return this.executeRead(
      {
        operation: () => apiKeySessionAuth.computeActionMac(apiKeySecret, actionHash),
        methodName: 'compute action MAC',
        ...options
      }
    );
  }

  /**
   * Encode a TOKEN-mode auth proof ({@code buildTokenAuthProof} on-chain helper).
   *
   * @public
   * @async
   * @param {ApiKeySessionClientBuildTokenAuthProofOptions} options - {@code expiry}, {@code scopeMask}, {@code mac}
   * @returns {Promise<string>} ABI-encoded auth proof bytes
   */
  async buildTokenAuthProof(options = {}) {
    const { expiry, scopeMask, mac } = options;
    requireNumber(expiry, 'expiry', { allowNegative: false });
    requireNumber(scopeMask, 'scopeMask', { allowNegative: false });
    requireBytes32(mac, 'mac');
    log.debug('Building token auth proof', sanitizer.forLog(options));

    const apiKeySessionAuth = this.getReadContract(getApiKeySessionAuthenticatorContract, this.config.addresses.apiKeySessionAuth);

    return this.executeRead(
      {
        operation: () => apiKeySessionAuth.buildTokenAuthProof(expiry, scopeMask, mac),
        methodName: 'build token auth proof',
        ...options
      }
    );
  }

  /**
   * Encode an ACTION-mode auth proof ({@code buildActionAuthProof} on-chain helper).
   *
   * @public
   * @async
   * @param {ApiKeySessionClientBuildActionAuthProofOptions} options - {@code mac}
   * @returns {Promise<string>} ABI-encoded auth proof bytes
   */
  async buildActionAuthProof(options = {}) {
    const { mac } = options;
    requireBytes32(mac, 'mac');
    log.debug('Building action auth proof', sanitizer.forLog(options));

    const apiKeySessionAuth = this.getReadContract(getApiKeySessionAuthenticatorContract, this.config.addresses.apiKeySessionAuth);

    return this.executeRead(
      {
        operation: () => apiKeySessionAuth.buildActionAuthProof(mac),
        methodName: 'build action auth proof',
        ...options
      }
    );
  }

  /**
   * Map a KeyVault selector to its bearer scope bit.
   *
   * @public
   * @async
   * @param {ApiKeySessionClientSelectorBitOptions} options - 4-byte {@code selector}
   * @returns {Promise<SelectorBitResult>} {@code ok} and {@code bit}
   */
  async selectorBit(options = {}) {
    const { selector } = options;
    requireBytes4(selector, 'selector');
    log.debug('Getting selector bit', sanitizer.forLog(options));

    const apiKeySessionAuth = this.getReadContract(getApiKeySessionAuthenticatorContract, this.config.addresses.apiKeySessionAuth);

    return this.executeRead(
      {
        operation: () => apiKeySessionAuth.selectorBit(selector),
        methodName: 'get selector bit',
        ...options
      }
    );
  }

  // ============================================================================
  // Write Methods
  // ============================================================================

  /**
   * Configure the API key session authenticator with ABI-encoded {@code bytes32 apiKeySecret}.
   *
   * @public
   * @async
   * @param {ApiKeySessionClientConfigureOptions} options - {@code keyVaultAddr} and {@code authConfig}
   * @returns {Promise<ConfigureApiKeySessionResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If {@code keyVaultAddr} is invalid or {@code authConfig} is not non-empty bytes
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code WalletConfigured} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks {@code authConfig = abi.encode(bytes32 apiKeySecret)} where {@code apiKeySecret == keccak256(apiKey)}.
   */
  async configure(options = {}) {
    const { keyVaultAddr, authConfig } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authConfig, 'authConfig');
    log.info('ApiKeySessionAuthenticator: configure');
    log.debug('Configuring API key session for keyVault', sanitizer.forLog(options));

    const apiKeySessionAuth = this.getWriteContract(getApiKeySessionAuthenticatorContract, this.config.addresses.apiKeySessionAuth);

    return this.executeWrite(
      {
        operation: () => apiKeySessionAuth.configure(keyVaultAddr, authConfig),
        methodName: 'configure API key session',
        parseEvents: [{
          eventDef: ApiKeySessionAuthenticatorEvents.WalletConfigured,
          contract: apiKeySessionAuth
        }],
        extraData: { authenticatorAddress: this.config.addresses.apiKeySessionAuth },
        ...options
      }
    );
  }

  /**
   * Rotate the stored secret, invalidating every outstanding bearer token.
   *
   * @public
   * @async
   * @param {ApiKeySessionClientRotateApiKeyOptions} options - {@code keyVaultAddr}, ACTION-mode {@code authProof}, {@code newApiKeySecret}
   * @returns {Promise<RotateApiKeyResult>} Standard write result with parsed {@code wallet}
   * @throws {ValidationError} If inputs are missing or invalid
   * @throws {WriteRequiresSignerError} If no write signer is configured
   * @throws {NetworkError} If the RPC interaction fails
   * @throws {ContractRevertError} If the transaction reverts
   * @throws {EventNotFoundError} If the {@code ApiKeyRotated} event is missing from the receipt
   * @throws {EventParseError} If the event log decodes but mapping fails
   * @throws {WalletError} For other unrecognised failures
   *
   * @remarks
   * {@code authProof = abi.encode(MODE_ACTION, abi.encode(bytes32 mac))}.
   * {@code newApiKeySecret = keccak256(newApiKey)}; must be non-zero.
   */
  async rotateApiKey(options = {}) {
    const { keyVaultAddr, authProof, newApiKeySecret } = options;
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    requireNonEmptyBytes(authProof, 'authProof');
    requireBytes32(newApiKeySecret, 'newApiKeySecret');
    log.info('ApiKeySessionAuthenticator: rotateApiKey');
    log.debug('Rotating API key for keyVault', sanitizer.forLog(options));

    const apiKeySessionAuth = this.getWriteContract(getApiKeySessionAuthenticatorContract, this.config.addresses.apiKeySessionAuth);

    return this.executeWrite(
      {
        operation: () => apiKeySessionAuth.rotateApiKey(keyVaultAddr, authProof, newApiKeySecret),
        methodName: 'rotate API key',
        parseEvents: [{
          eventDef: ApiKeySessionAuthenticatorEvents.ApiKeyRotated,
          contract: apiKeySessionAuth
        }],
        extraData: { authenticatorAddress: this.config.addresses.apiKeySessionAuth },
        ...options
      }
    );
  }
}

export default ApiKeySessionAuthenticatorClient;
