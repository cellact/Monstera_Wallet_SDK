/**
 * End-user vault call pipeline: session merge → auth-proof encoding → client invoke.
 *
 * @typedef {import('../../../types/index.js').EncodeAuthProofInputOptions} EncodeAuthProofInputOptions
 * @typedef {import('../../../types/index.js').EncodeAuthProofOptionsResult} EncodeAuthProofOptionsResult
 * @typedef {import('../../../types/index.js').AuthActionInput} AuthActionInput
 * @typedef {import('./CredentialsSession.js').CredentialsSession} CredentialsSession
 * @typedef {import('../proof/AuthProofPipeline.js').AuthProofPipeline} AuthProofPipeline
 *
 * @module internal/auth/session/VaultCallPipeline
 */

import { CredentialsRequiredError } from '../../../errors/index.js';

/**
 * @typedef {Object} ResolveVaultOptionsFlags
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
   * @param {{ credentialsSession: CredentialsSession | null; authProofPipeline: AuthProofPipeline }} deps
   */
  constructor({ credentialsSession, authProofPipeline }) {
    this._credentialsSession = credentialsSession;
    this._authProofPipeline = authProofPipeline;
  }

  /**
   * @public
   * @returns {boolean}
   */
  hasCredentials() {
    return this._credentialsSession != null;
  }

  /**
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

    // console.log('resolved', resolved);
    return resolved;
  }

  /**
   * @public
   * @async
   * @param {EncodeAuthProofInputOptions} options
   * @param {(resolved: Record<string, unknown>) => AuthActionInput} buildAction
   * @returns {Promise<EncodeAuthProofOptionsResult>}
   */
  async encodeAuthProof(options, buildAction) {
    const resolved = await this.resolveVaultOptions(options, { defaultIndex: true });
    return this._authProofPipeline.encodeVaultCall(resolved, this._credentialsSession, buildAction);
  }

  /**
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
