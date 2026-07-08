/**
 * End-user vault call pipeline: session merge → auth-proof encoding → client invoke.
 *
 * @typedef {import('../../../types/index.js').EncodeAuthProofInputOptions} EncodeAuthProofInputOptions
 * @typedef {import('../../../types/index.js').EncodeAuthProofOptionsResult} EncodeAuthProofOptionsResult
 * @typedef {import('../../../types/index.js').AuthActionInput} AuthActionInput
 * @typedef {import('./CredentialsSession.js').CredentialsSession} CredentialsSession
 * @typedef {import('../proof/AuthProofPipeline.js').AuthProofPipeline} AuthProofPipeline
 * @typedef {import('./CredentialsSession.js').ResolveVaultOptionsFlags} ResolveVaultOptionsFlags
 *
 * @module internal/auth/session/VaultCallPipeline
 */

import { CredentialsRequiredError } from '../../../errors/index.js';
import { CredentialsSession } from './CredentialsSession.js';
import { withDefaultAccountIndex } from '../../vault/accountIndex.js';
import log from '../../logger.js';

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
    return CredentialsSession.resolveVaultOptions(this._credentialsSession, options, flags);
  }

  /**
   * @public
   * @async
   * @param {EncodeAuthProofInputOptions} options
   * @param {(resolved: Record<string, unknown>) => AuthActionInput} buildAction
   * @returns {Promise<EncodeAuthProofOptionsResult>}
   */
  async encodeAuthProof(options, buildAction) {
    const resolved = withDefaultAccountIndex(await this.resolveVaultOptions(options));
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
    const preEncoded =
      options.authProof != null &&
      (typeof options.authProof === 'string' || options.authProof instanceof Uint8Array);

    log.debug('vault pipeline: invoke start', { preEncodedAuthProof: preEncoded });

    const encoded = await this.encodeAuthProof(options, buildAction);

    log.debug('vault pipeline: invoke ready', {
      keyVaultAddr: encoded.keyVaultAddr,
      preEncodedAuthProof: preEncoded
    });

    return invoke(encoded);
  }
}
