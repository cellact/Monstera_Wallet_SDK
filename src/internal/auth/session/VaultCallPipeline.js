/**
 * End-user vault call pipeline: session merge → auth-proof encoding → client invoke.
 *
 * @typedef {import('../../../types/index.js').EncodeAuthProofInputOptions} EncodeAuthProofInputOptions
 * @typedef {import('../../../types/index.js').EncodeAuthProofOptionsResult} EncodeAuthProofOptionsResult
 * @typedef {import('../../../types/index.js').AuthActionInput} AuthActionInput
 * @typedef {import('./CredentialsSession.js').CredentialsSession} CredentialsSession
 * @typedef {import('../proof/EncodeAuthProof.js').EncodeAuthProof} EncodeAuthProof
 *
 * @module internal/auth/session/VaultCallPipeline
 */

import { ValidationError, CredentialsRequiredError } from '../../../errors/index.js';

/**
 * @typedef {Object} ResolveVaultOptionsFlags
 * @property {boolean} [requireAuthProof=false]
 * @property {boolean} [defaultCurrentPassword=false]
 * @property {boolean} [defaultIndex=false]
 */

/**
 * Orchestrates credentials-session defaults and KeyVault auth-proof encoding.
 *
 * @public
 */
export class VaultCallPipeline {
  /**
   * @public
   * @param {{ credentialsSession: CredentialsSession | null; encodeAuthProof: EncodeAuthProof }} deps
   */
  constructor({ credentialsSession, encodeAuthProof }) {
    this._credentialsSession = credentialsSession;
    this._encodeAuthProof = encodeAuthProof;
  }

  /**
   * @public
   * @returns {boolean}
   */
  hasCredentials() {
    return this._credentialsSession != null;
  }

  /**
   * Attach or replace the active credentials session (used by tests and advanced wiring).
   *
   * @public
   * @param {CredentialsSession | null} session
   */
  setCredentialsSession(session) {
    this._credentialsSession = session;
  }

  /**
   * @public
   * @returns {CredentialsSession | null}
   */
  getCredentialsSession() {
    return this._credentialsSession;
  }

  /**
   * @public
   * @param {string} operation
   * @throws {CredentialsRequiredError}
   */
  requireUserAccess(operation) {
    if (!this._credentialsSession) {
      throw new CredentialsRequiredError(operation);
    }
  }

  /**
   * Merge credentials-session defaults into vault-scoped call options.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}]
   * @param {ResolveVaultOptionsFlags} [flags={}]
   * @returns {Promise<Record<string, unknown>>}
   * @throws {CredentialsRequiredError}
   */
  async resolveVaultOptions(options = {}, flags = {}) {
    let resolved;

    if (this._credentialsSession) {
      resolved = await this._credentialsSession.applyToOptions(options, flags);
    } else if (options.keyVaultAddr) {
      resolved = { ...options };
    } else {
      throw new CredentialsRequiredError('vault operation');
    }

    if (flags.defaultIndex && (resolved.index === undefined || resolved.index === null)) {
      resolved.index = 0;
    }
    return resolved;
  }

  /**
   * Encode structured {@code authProof} for a KeyVault call, injecting {@code action} when omitted.
   *
   * @public
   * @async
   * @param {EncodeAuthProofInputOptions} options
   * @param {(resolved: Record<string, unknown>) => AuthActionInput} buildAction
   * @returns {Promise<EncodeAuthProofOptionsResult>}
   */
  async encodeAuthProof(options, buildAction) {
    const resolved = await this.resolveVaultOptions(options, {
      requireAuthProof: true,
      defaultIndex: true
    });
    const { authProof } = resolved;

    if (!authProof || typeof authProof === 'string' || authProof instanceof Uint8Array) {
      return this._encodeAuthProof.encode(resolved);
    }

    if (typeof authProof !== 'object' || Array.isArray(authProof)) {
      return this._encodeAuthProof.encode(resolved);
    }

    if (authProof.action != null) {
      return this._encodeAuthProof.encode(resolved);
    }

    if (typeof buildAction !== 'function') {
      throw new ValidationError(
        'authProof.action is required for structured auth proofs on this call',
        'authProof',
        authProof
      );
    }

    return this._encodeAuthProof.encode({
      ...resolved,
      authProof: {
        ...authProof,
        action: buildAction(resolved)
      }
    });
  }

  /**
   * Run a KeyVault delegate after credentials check, option merge, and auth-proof encoding.
   *
   * @public
   * @async
   * @template T
   * @param {Record<string, unknown>} options
   * @param {(resolved: Record<string, unknown>) => AuthActionInput} buildAction
   * @param {(encoded: EncodeAuthProofOptionsResult) => Promise<T>} invoke
   * @returns {Promise<T>}
   */
  async invokeWithAuthProof(options, buildAction, invoke) {
    const encoded = await this.encodeAuthProof(options, buildAction);
    return invoke(encoded);
  }
}
