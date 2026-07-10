/**
 * Username/password session for Monstera connect.
 *
 * Resolves and caches the wallet proxy and KeyVault addresses for a registered username,
 * and exposes password and/or API key material for vault-authenticated calls.
 *
 * @module internal/auth/session/CredentialsSession
 */

import { ZeroAddress } from '../../../adapters/ethers/addresses.js';
import { keccak256, toUtf8Bytes } from '../../../adapters/ethers/hashing.js';
import { CredentialsRequiredError, ValidationError } from '../../../errors/index.js';
import { requireNormalizedUsername } from '../../assert.js';

export { parseConnectCredentials } from '../../validators/connectOptions.js';

/**
 * Factory lookups required to resolve a username to on-chain wallet addresses.
 *
 * @typedef {Object} CredentialsSessionDeps
 * @property {(options: { username: string }) => Promise<Bytes32>} hashUsername
 * @property {(options: { usernameHash: Bytes32 }) => Promise<Address>} walletOfUsername
 * @property {(options: { walletAddr: Address }) => Promise<Address>} getKeyVaultAddr
 */

/**
 * @typedef {Object} ResolveVaultOptionsFlags
 * @property {boolean} [defaultCurrentPassword=false] - Inject {@code currentPassword} from the session password
 * @property {boolean} [defaultApiKeySecret=false] - Inject {@code apiKeySecret} from the session API key
 */

/**
 * @public
 */
export class CredentialsSession {
  /**
   * @public
   * @param {ConnectCredentials} credentials
   * @param {CredentialsSessionDeps} deps
   */
  constructor(credentials, deps) {
    this._username = credentials.username;
    this._passwordBytes = credentials.password ? toUtf8Bytes(credentials.password) : null;
    this._passwordHash = this._passwordBytes ? keccak256(this._passwordBytes) : null;
    this._apiKeySecret = credentials.apiKey ? keccak256(credentials.apiKey) : null;
    this._deps = deps;
    /** @type {Address | null} */
    this._walletAddr = null;
    /** @type {Address | null} */
    this._keyVaultAddr = null;
    /** @type {Promise<void> | null} */
    this._resolvePromise = null;
  }

  /**
   * @public
   * @returns {boolean}
   */
  isActive() {
    return true;
  }

  /**
   * @public
   * @returns {boolean}
   */
  hasPassword() {
    return this._passwordBytes != null;
  }

  /**
   * @public
   * @returns {boolean}
   */
  hasApiKey() {
    return this._apiKeySecret != null;
  }

  /**
   * @public
   * @returns {Bytes32}
   */
  getApiKeySecret() {
    if (!this._apiKeySecret) {
      throw new ValidationError('credentials.apiKey is required for this operation', 'credentials.apiKey', null);
    }
    return this._apiKeySecret;
  }

  /**
   * @public
   * @returns {Uint8Array}
   */
  getPasswordBytes() {
    if (!this._passwordBytes) {
      throw new ValidationError('credentials.password is required for this operation', 'credentials.password', null);
    }
    return this._passwordBytes;
  }

  /**
   * @public
   * @returns {Bytes32}
   */
  getPasswordHash() {
    if (!this._passwordHash) {
      throw new ValidationError('credentials.password is required for this operation', 'credentials.password', null);
    }
    return this._passwordHash;
  }

  /**
   * @public
   * @returns {string}
   */
  getUsername() {
    return this._username;
  }

  /**
   * @public
   * @async
   * @returns {Promise<Address>}
   */
  async getWalletAddr() {
    await this._ensureResolved();
    return /** @type {Address} */ (this._walletAddr);
  }

  /**
   * @public
   * @async
   * @returns {Promise<Address>}
   */
  async getKeyVaultAddr() {
    await this._ensureResolved();
    return /** @type {Address} */ (this._keyVaultAddr);
  }

  /**
   * Merge session defaults into caller options for KeyVault-scoped methods.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}]
   * @param {ResolveVaultOptionsFlags} [flags={}]
   * @returns {Promise<Record<string, unknown>>}
   */
  async applyToOptions(options = {}, flags = {}) {
    const resolved = { ...options };

    if (!resolved.keyVaultAddr) {
      resolved.keyVaultAddr = await this.getKeyVaultAddr();
    }

    if (flags.defaultCurrentPassword && resolved.currentPassword == null) {
      resolved.currentPassword = this._passwordBytes;
    }

    if (flags.defaultApiKeySecret && resolved.apiKeySecret == null) {
      resolved.apiKeySecret = this._apiKeySecret;
    }

    return resolved;
  }

  /**
   * Merge session defaults into caller options, or pass through explicit {@code keyVaultAddr}.
   *
   * @public
   * @static
   * @async
   * @param {CredentialsSession | null} credentialsSession
   * @param {Record<string, unknown>} [options={}]
   * @param {ResolveVaultOptionsFlags} [flags={}]
   * @returns {Promise<Record<string, unknown>>}
   * @throws {CredentialsRequiredError}
   */
  static async resolveVaultOptions(credentialsSession, options = {}, flags = {}) {
    let resolved;

    if (credentialsSession) {
      resolved = await credentialsSession.applyToOptions(options, flags);
    } else if (options.keyVaultAddr) {
      resolved = { ...options };
    } else {
      throw new CredentialsRequiredError('vault operation');
    }

    return resolved;
  }

  /**
   * @private
   * @async
   * @returns {Promise<void>}
   */
  async _ensureResolved() {
    if (this._keyVaultAddr) {
      return;
    }

    if (!this._resolvePromise) {
      this._resolvePromise = this._resolveAddresses();
    }

    await this._resolvePromise;
  }

  /**
   * @private
   * @async
   * @returns {Promise<void>}
   */
  async _resolveAddresses() {
    const normalized = requireNormalizedUsername(this._username, 'credentials.username');

    const usernameHash = await this._deps.hashUsername({ username: normalized });
    const walletAddr = await this._deps.walletOfUsername({ usernameHash });

    if (!walletAddr || walletAddr === ZeroAddress) {
      throw new ValidationError(
        'No wallet is registered for the supplied credentials.username',
        'credentials.username',
        this._username
      );
    }

    const keyVaultAddr = await this._deps.getKeyVaultAddr({ walletAddr });

    this._walletAddr = walletAddr;
    this._keyVaultAddr = keyVaultAddr;
  }
}

