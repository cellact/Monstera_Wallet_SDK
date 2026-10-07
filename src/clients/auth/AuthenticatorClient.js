/**
 * Authenticator registry exposed to the {@link Monstera} facade as {@code monstera.auth}.
 *
 * Eagerly instantiates one client per built-in authenticator type ({@code password},
 * {@code walletSignature}, {@code dualFactor}, {@code passwordMinuteSignature}) and exposes them as
 * named properties as well as via {@link AuthenticatorClient#getClient}. Add a new authenticator
 * by importing its client and assigning it on a new property in the constructor.
 *
 * Advanced. Authenticator administration goes through {@link Monstera} (`configurePassword`, `updatePassword`, and the matching methods for other authenticators).
 * Use `sdk.auth` when you need the authenticator contract client directly.
 *
 * @module clients/auth/AuthenticatorClient
 */

import ApiKeySessionAuthenticatorClient from './ApiKeySessionAuthenticatorClient.js';
import PasswordAuthenticatorClient from './PasswordAuthenticatorClient.js';
import WalletSignatureAuthenticatorClient from './WalletSignatureAuthenticatorClient.js';
import DualFactorAuthenticatorClient from './DualFactorAuthenticatorClient.js';
import PasswordMinuteSignatureAuthenticatorClient from './PasswordMinuteSignatureAuthenticatorClient.js';
import MultiAuthenticatorClient from './MultiAuthenticatorClient.js';
import PasswordOrWalletSignatureAuthenticatorClient from './PasswordOrWalletSignatureAuthenticatorClient.js';
import { ValidationError } from '../../errors/index.js';
import log from '../../internal/logger.js';
import { requireString } from '../../internal/validation/assert.js';

/**
 * @public
 */
class AuthenticatorClient {
  /**
   * Wire one client per built-in authenticator type.
   *
   * @public
   * @param {EthersProvider} readProvider - Read provider shared with each child client
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped write signer ({@code null} for read-only)
   * @param {NetworkConfig} config - Resolved network config (must include all authenticator addresses)
   */
  constructor(readProvider, writeSigner, config) {
    this.readProvider = readProvider;
    this.writeSigner = writeSigner;
    this.config = config;

    this.apiKeySession = new ApiKeySessionAuthenticatorClient(readProvider, writeSigner, config);
    this.walletSignature = new WalletSignatureAuthenticatorClient(readProvider, writeSigner, config);
    this.password = new PasswordAuthenticatorClient(readProvider, writeSigner, config);
    this.dualFactor = new DualFactorAuthenticatorClient(readProvider, writeSigner, config);
    this.passwordMinuteSignature = new PasswordMinuteSignatureAuthenticatorClient(readProvider, writeSigner, config);
    this.multi = new MultiAuthenticatorClient(readProvider, writeSigner, config);
    this.passwordOrWalletSignature = new PasswordOrWalletSignatureAuthenticatorClient(readProvider, writeSigner, config);
  }

  /**
   * Resolve a registered authenticator client by string key.
   *
   * @public
   * @param {string} type - Authenticator type ({@code 'walletSignature'}, {@code 'password'}, {@code 'dualFactor'}, {@code 'passwordMinuteSignature'}), etc.
   * @returns {AuthenticatorClientInstance} The matching client instance
   * @throws {ValidationError} If {@code type} is missing, not a string, or not a registered authenticator type
   */
  getClient(type) {
    requireString(type, 'type');
    log.debug('AuthenticatorClient: getClient', { type });
    const available = this.getAvailableTypes();
    if (!available.includes(type)) {
      throw new ValidationError(
        `Authenticator client type '${type}' not found. Available types: ${available.join(', ')}`,
        'type',
        type
      );
    }
    return this[type];
  }

  /**
   * List the registered authenticator type names.
   *
   * @public
   * @returns {string[]} Names suitable for {@link AuthenticatorClient#getClient}
   * @remarks Filters out the constructor-stored {@code readProvider}, {@code writeSigner}, {@code config} keys.
   */
  getAvailableTypes() {
    return Object.keys(this).filter(key => !['readProvider', 'writeSigner', 'config'].includes(key));
  }
}

export default AuthenticatorClient;
