/**
 * Authenticator management call pipeline: session merge → prepare(flowId) → client invoke.
 *
 * @typedef {import('./CredentialsSession.js').CredentialsSession} CredentialsSession
 * @typedef {import('../proof/AuthProofPipeline.js').AuthProofPipeline} AuthProofPipeline
 * @typedef {import('../authenticators/registry.js').AuthProofFlowId} AuthProofFlowId
 * @typedef {import('./CredentialsSession.js').ResolveVaultOptionsFlags} ResolveVaultOptionsFlags
 *
 * @module internal/auth/session/AuthenticatorCallPipeline
 */

import { CredentialsSession } from './CredentialsSession.js';
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
 * @param {AuthProofFlowId} flowId
 * @param {Record<string, unknown>} resolved
 * @param {Address} authenticatorAddr
 * @returns {Record<string, unknown>}
 */
function toPrepareInput(flowId, resolved, authenticatorAddr) {
  const base = { keyVaultAddr: resolved.keyVaultAddr, authenticatorAddr };

  switch (flowId) {
    case 'password':
      return { ...base, password: resolved.currentPassword ?? resolved.password };
    case 'minuteSignature':
      return { ...base, passwordHash: resolved.passwordHash };
    case 'walletSignature':
      return { ...base, signer: resolved.signer, deadline: resolved.deadline };
    case 'dualFactor':
      return {
        ...base,
        passwordHash: resolved.passwordHash,
        signer: resolved.signer,
        deadline: resolved.deadline
      };
    case 'apiKeySession':
      return {
        ...base,
        apiKeySecret: resolved.apiKeySecret,
        mode: resolved.mode,
        expiry: resolved.expiry,
        scopeMask: resolved.scopeMask
      };
    case 'multi': {
      const hasExplicitProofRoute =
        resolved.viaChild != null ||
        resolved.viaChildFlowId != null ||
        resolved.childFlowId != null;
      return {
        ...base,
        viaChild: resolved.viaChild,
        viaChildFlowId: resolved.viaChildFlowId,
        childFlowId: resolved.childFlowId,
        ...(hasExplicitProofRoute ? {} : { child: resolved.child }),
        apiKeySecret: resolved.apiKeySecret,
        password: resolved.currentPassword ?? resolved.password,
        passwordHash: resolved.passwordHash,
        signer: resolved.signer,
        deadline: resolved.deadline,
        mode: resolved.mode,
        expiry: resolved.expiry,
        scopeMask: resolved.scopeMask
      };
    }
    case 'passwordOrWalletSignature':
      return {
        ...base,
        method: resolved.method,
        password: resolved.currentPassword ?? resolved.password,
        signer: resolved.signer,
        deadline: resolved.deadline
      };
    default:
      return base;
  }
}

/**
 * Orchestrates credentials-session defaults and authenticator auth-proof encoding.
 *
 * @public
 */
export class AuthenticatorCallPipeline {
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
   * @async
   * @param {AuthProofFlowId} flowId
   * @param {Record<string, unknown>} [options={}]
   * @param {AuthenticatorEncodeConfig} [config={}]
   * @returns {Promise<AuthenticatorEncodeResult>}
   */
  async encodeAuthProof(flowId, options = {}, config = {}) {
    const { flags = {}, buildAction, flowOptions = {}, overrides = {} } = config;
    const resolved = await CredentialsSession.resolveVaultOptions(
      this._credentialsSession,
      options,
      flags
    );
    const { authenticatorAddr: defaultAddr, spec } = this._authProofPipeline.resolveByFlowId(flowId);
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

    const mappedInput = toPrepareInput(flowId, resolved, authenticatorAddr);

    const prepareInput =
      typeof buildAction === 'function'
        ? { ...mappedInput, action: buildAction(resolved, authenticatorAddr) }
        : { ...resolved, ...mappedInput };

    const prepared = await this._authProofPipeline.prepare(flowId, prepareInput, flowOptions);

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
