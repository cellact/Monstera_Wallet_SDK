/**
 * End-user vault call pipeline: session merge → auth-proof encoding → client invoke.
 *
 * @typedef {import('../session/ConnectSession.js').ConnectSession} ConnectSession
 * @typedef {import('../encoding/AuthProofEncoder.js').AuthProofEncoder} AuthProofEncoder
 * @typedef {import('../session/ConnectSession.js').ResolveVaultOptionsFlags} ResolveVaultOptionsFlags
 *
 * @module internal/auth/pipelines/KeyVaultAuthPipeline
 */

import { CredentialsRequiredError } from '../../../errors/index.js';
import { ConnectSession } from '../session/ConnectSession.js';
import { withDefaultAccountIndex } from '../../vault/accountIndex.js';
import log from '../../logger.js';

/**
 * Orchestrates credentials-session defaults and KeyVault auth-proof encoding.
 *
 * @public
 */
export class KeyVaultAuthPipeline {
  /**
   * @public
   * @param {{ connectSession: ConnectSession | null; authProofEncoder: AuthProofEncoder }} deps
   */
  constructor({ connectSession, authProofEncoder }) {
    this._connectSession = connectSession;
    this._authProofEncoder = authProofEncoder;
  }

  /**
   * @public
   * @returns {boolean}
   */
  hasCredentials() {
    return this._connectSession != null;
  }

  /**
   * @public
   * @param {ConnectSession | null} session
   */
  setConnectSession(session) {
    this._connectSession = session;
  }

  /**
   * @public
   * @returns {ConnectSession | null}
   */
  getConnectSession() {
    return this._connectSession;
  }

  /**
   * @public
   * @param {string} operation
   * @throws {CredentialsRequiredError}
   */
  requireUserAccess(operation) {
    if (!this._connectSession) {
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
  async mergeVaultOptions(options = {}, flags = {}) {
    return ConnectSession.mergeVaultOptions(this._connectSession, options, flags);
  }

  /**
   * @public
   * @async
   * @param {EncodeAuthProofInputOptions} options
   * @param {(resolved: Record<string, unknown>) => AuthActionInput} buildAction
   * @returns {Promise<EncodeAuthProofOptionsResult>}
   */
  async encodeAuthProof(options, buildAction) {
    const resolved = withDefaultAccountIndex(await this.mergeVaultOptions(options));
    return this._authProofEncoder.encodeForKeyVault(resolved, this._connectSession, buildAction);
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
