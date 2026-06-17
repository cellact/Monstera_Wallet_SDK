/**
 * Orchestrates Monstera auth-proof flows: validation, defaults, action resolution, and signing.
 *
 * @typedef {import('../../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 * @typedef {import('../../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 * @typedef {import('../../types/index.js').AuthProofFlowOptions} AuthProofFlowOptions
 * @typedef {import('../../types/index.js').ResolvedAuthAction} ResolvedAuthAction
 *
 * @module internal/auth/proof/ProofFlowOrchestrator
 */

import {
  createAuthProofWalletSignature,
  createAuthProofMinuteSignature,
  createAuthProofDualFactor,
  createAuthProofPassword
} from './createAuthProof.js';
import {
  assertAuthActionInput,
  buildAuthContext,
  resolveActionHash
} from '../context/createAuthContext.js';
import { buildAuthenticatorVerifyProbeAction } from '../context/actions/authenticator/authenticatorProbe.js';
import { requireAddress, requireBytes32, requireUtf8Bytes, requireWalletOrHdNode } from '../../assert.js';
import {
  withWalletSignatureProofDefaults,
  withMinuteSignatureProofDefaults,
  withDualFactorProofDefaults,
  withPasswordProofDefaults
} from './proofDefaults.js';

/** @typedef {'walletSignature' | 'minuteSignature' | 'dualFactor' | 'password'} AuthProofFlowId */

/**
 * @private
 * @type {Record<AuthProofFlowId, {
 *   validate: (options: Record<string, unknown>) => void,
 *   withDefaults: (config: MonsteraConfigOptions, options: Record<string, unknown>) => Record<string, unknown>,
 *   createProof: (params: { readProvider: EthersAbstractProvider, resolved: Record<string, unknown>, actionHash: import('../../types/index.js').Bytes32 }) => Promise<unknown>
 * }>}
 */
const PROOF_FLOW_SPECS = {
  walletSignature: {
    validate(options) {
      requireAddress(options.keyVaultAddr, 'keyVaultAddr');
      requireWalletOrHdNode(options.signer, 'signer');
    },
    withDefaults: withWalletSignatureProofDefaults,
    createProof: ({ resolved, actionHash }) =>
      createAuthProofWalletSignature({ ...resolved, actionHash })
  },
  minuteSignature: {
    validate(options) {
      requireAddress(options.keyVaultAddr, 'keyVaultAddr');
      requireBytes32(options.passwordHash, 'passwordHash');
    },
    withDefaults: withMinuteSignatureProofDefaults,
    createProof: ({ readProvider, resolved, actionHash }) =>
      createAuthProofMinuteSignature({
        provider: readProvider,
        ...resolved,
        actionHash
      })
  },
  dualFactor: {
    validate(options) {
      requireAddress(options.keyVaultAddr, 'keyVaultAddr');
      requireBytes32(options.passwordHash, 'passwordHash');
      requireWalletOrHdNode(options.signer, 'signer');
    },
    withDefaults: withDualFactorProofDefaults,
    createProof: ({ readProvider, resolved, actionHash }) =>
      createAuthProofDualFactor({
        provider: readProvider,
        ...resolved,
        actionHash
      })
  },
  password: {
    validate(options) {
      requireAddress(options.keyVaultAddr, 'keyVaultAddr');
      requireUtf8Bytes(options.password, 'password');
    },
    withDefaults: withPasswordProofDefaults,
    createProof: ({ resolved, actionHash }) =>
      createAuthProofPassword({ password: resolved.password, actionHash })
  }
};

/**
 * @public
 */
export class ProofFlowOrchestrator {
  /**
   * @public
   * @param {Object} deps
   * @param {MonsteraConfigOptions} deps.config - Resolved SDK config
   * @param {EthersAbstractProvider} deps.readProvider - RPC provider for action hash / minute-bucket reads
   */
  constructor({ config, readProvider }) {
    this._config = config;
    this._readProvider = readProvider;
  }

  /**
   * Resolve {@code action} and {@code actionHash} for auth proof flows.
   *
   * @public
   * @async
   * @param {Record<string, unknown>} resolved - Options after a {@code with*ProofDefaults} helper
   * @param {Record<string, unknown>} options - Original caller options
   * @param {AuthProofFlowOptions} [flowOptions={}]
   * @returns {Promise<ResolvedAuthAction>}
   */
  async resolveAuthAction(resolved, options, flowOptions = {}) {
    const { useVerifyProbe = false } = flowOptions;
    let action = options.action;
    let actionHash = options.actionHash;

    if (actionHash == null) {
      if (action == null && useVerifyProbe) {
        action = buildAuthenticatorVerifyProbeAction(resolved.authenticatorAddr);
      }
      actionHash = await resolveActionHash(
        {
          readProvider: this._readProvider,
          chainId: resolved.chainId,
          keyVaultAddr: resolved.keyVaultAddr
        },
        { action, actionHash }
      );
    } else if (flowOptions.includeAuthContext && action == null) {
      assertAuthActionInput(action);
    }

    return { action, actionHash };
  }

  /**
   * Validate, default-fill, resolve {@code actionHash}, and produce a proof for one flow type.
   *
   * @public
   * @async
   * @param {AuthProofFlowId} flowId
   * @param {Record<string, unknown>} [options={}]
   * @param {AuthProofFlowOptions} [flowOptions={}]
   * @returns {Promise<Record<string, unknown>>}
   */
  async prepare(flowId, options = {}, flowOptions = {}) {
    const { includeAuthContext = false } = flowOptions;
    const spec = PROOF_FLOW_SPECS[flowId];

    spec.validate(options);
    const resolved = spec.withDefaults(this._config, options);

    const { action: resolvedAction, actionHash } = await this.resolveAuthAction(
      resolved,
      options,
      flowOptions
    );

    const proofResult = await spec.createProof({
      readProvider: this._readProvider,
      resolved,
      actionHash
    });

    const authContext = includeAuthContext
      ? buildAuthContext({
          target: resolvedAction.target ?? resolved.keyVaultAddr,
          selector: resolvedAction.selector,
          paramsHash: resolvedAction.paramsHash,
          actionHash
        })
      : null;

    if (flowId === 'minuteSignature') {
      return { resolved, actionHash, ...proofResult, action: authContext };
    }

    return {
      resolved,
      actionHash,
      authProof: proofResult,
      action: authContext
    };
  }
}
