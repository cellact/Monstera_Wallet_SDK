/**
 * Authenticator management call pipeline: session merge → prepare(flowId) → client invoke.
 *
 * @typedef {import('../session/ConnectSession.js').ConnectSession} ConnectSession
 * @typedef {import('../encoding/AuthProofEncoder.js').AuthProofEncoder} AuthProofEncoder
 * @typedef {import('../specs/registry.js').AuthProofFlowId} AuthProofFlowId
 * @typedef {import('../session/ConnectSession.js').ResolveVaultOptionsFlags} ResolveVaultOptionsFlags
 *
 * @module internal/auth/pipelines/ExplicitAuthPipeline
 */

import { ConnectSession } from '../session/ConnectSession.js';
import log from '../../logger.js';

/**
 * @typedef {Object} AuthenticatorInvokeOverrides
 * @property {Address} [authenticatorAddr]
 */

/**
 * @typedef {Object} AuthenticatorEncodeConfig
 * @property {ResolveVaultOptionsFlags} [flags]
 * @property {(resolved: Record<string, unknown>, authenticatorAddr: Address) => AuthActionInput} [buildAction]
 * @property {AuthProofFlowOptions} [flowOptions]
 * @property {AuthenticatorInvokeOverrides} [overrides]
 */

/**
 * @template T
 * @typedef {AuthenticatorEncodeConfig & {
 *   buildAction: (resolved: Record<string, unknown>, authenticatorAddr: Address) => AuthActionInput;
 *   invoke: (ctx: AuthenticatorInvokeContext) => Promise<T>;
 * }} AuthenticatorInvokeConfig
 */

/**
 * @typedef {Record<string, unknown> & {
 *   authProof: Bytes;
 *   authenticatorAddr: Address;
 *   action?: AuthContext | null;
 *   actionHash?: Bytes32;
 *   minuteBucket?: bigint;
 *   derivedAddress?: Address;
 * }} AuthenticatorEncodeResult
 */

/**
 * @typedef {AuthenticatorEncodeResult} AuthenticatorInvokeContext
 */

/**
 * @param {Record<string, unknown>} resolved
 * @param {Address} defaultAddr
 * @param {Address | undefined} overrideAddr
 * @returns {Address}
 */
function resolveAuthenticatorAddr(resolved, defaultAddr, overrideAddr) {
  if (resolved.authenticatorAddr != null) {
    return /** @type {Address} */ (resolved.authenticatorAddr);
  }
  if (overrideAddr != null) {
    return overrideAddr;
  }
  return defaultAddr;
}

/**
 * Orchestrates credentials-session defaults and authenticator auth-proof encoding.
 *
 * @public
 */
export class ExplicitAuthPipeline {
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
   * @async
   * @param {AuthProofFlowId} flowId
   * @param {Record<string, unknown>} [options={}]
   * @param {AuthenticatorEncodeConfig} [config={}]
   * @returns {Promise<AuthenticatorEncodeResult>}
   */
  async encodeAuthProof(flowId, options = {}, config = {}) {
    const { flags = {}, buildAction, flowOptions = {}, overrides = {} } = config;
    const resolved = await ConnectSession.mergeVaultOptions(
      this._connectSession,
      options,
      flags
    );
    const { authenticatorAddr: defaultAddr, spec } = this._authProofEncoder.resolveByFlowId(flowId);
    const authenticatorAddr = resolveAuthenticatorAddr(
      resolved,
      defaultAddr,
      overrides.authenticatorAddr
    );

    log.debug('auth pipeline: explicit encode', {
      flowId,
      encoderId: spec.id,
      authenticatorAddr,
      keyVaultAddr: resolved.keyVaultAddr,
      sessionFlags: flags,
      hasBuildAction: typeof buildAction === 'function'
    });

    const mappedInput = spec.mapSessionResolved(resolved, authenticatorAddr);

    const prepareInput =
      typeof buildAction === 'function'
        ? { ...mappedInput, action: buildAction(resolved, authenticatorAddr) }
        : { ...resolved, ...mappedInput };

    const prepared = await this._authProofEncoder.encodeForFlow(flowId, prepareInput, flowOptions);

    return {
      ...resolved,
      ...prepared,
      authProof: prepared.authProof,
      authenticatorAddr
    };
  }

  /**
   * @public
   * @async
   * @template T
   * @param {AuthProofFlowId} flowId
   * @param {Record<string, unknown>} [options={}]
   * @param {AuthenticatorInvokeConfig<T>} config
   * @returns {Promise<T>}
   */
  async invokeWithAuthProof(flowId, options = {}, config) {
    const { flags = {}, buildAction, invoke, flowOptions, overrides = {} } = config;
    const encoded = await this.encodeAuthProof(flowId, options, {
      flags,
      buildAction,
      flowOptions,
      overrides
    });
    return invoke(encoded);
  }
}
