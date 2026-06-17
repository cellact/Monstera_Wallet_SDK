/**
 * Username/password session for Monstera connect.
 *
 * Resolves and caches the wallet proxy and KeyVault addresses for a registered username,
 * and supplies default password auth material for vault-authenticated calls.
 *
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 *
 * @module internal/auth/session/CredentialsSession
 */

import { ZeroAddress } from '../../../adapters/ethers/addresses.js';
import { toUtf8Bytes } from '../../../adapters/ethers/hashing.js';
import { ValidationError } from '../../../errors/index.js';
import { normalizeUsername } from '../../utils/normalize.js';

export { parseConnectCredentials } from '../../validators/connectOptions.js';

/**
 * @typedef {Object} ConnectCredentialsInput
 * @property {string} username - Registered username (factory-normalised before hashing)
 * @property {string} password - UTF-8 password used for PasswordAuthenticator proofs
 */

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
 * @property {boolean} [requireAuthProof=false] - Inject default structured {@code authProof} when absent
 * @property {boolean} [defaultCurrentPassword=false] - Inject {@code currentPassword} from the session password
 */

/**
 * @public
 */
export class CredentialsSession {
  /**
   * @public
   * @param {ConnectCredentialsInput} credentials
   * @param {CredentialsSessionDeps} deps
   */
  constructor(credentials, deps) {
    this._username = credentials.username;
    this._passwordBytes = toUtf8Bytes(credentials.password);
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
   * @returns {Uint8Array}
   */
  getPasswordBytes() {
    return this._passwordBytes;
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

    if (flags.requireAuthProof && resolved.authProof == null) {
      resolved.authProof = { password: this._passwordBytes };
    }

    if (flags.defaultCurrentPassword && resolved.currentPassword == null) {
      resolved.currentPassword = this._passwordBytes;
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
    const normalized = normalizeUsername(this._username);
    if (!normalized) {
      throw new ValidationError(
        'credentials.username must be a non-empty string after normalisation',
        'credentials.username',
        this._username
      );
    }

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

