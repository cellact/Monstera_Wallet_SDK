/**
 * Unified auth-proof pipeline for all built-in authenticators.
 *
 * @description Single entry point for:
 * - Vault-authenticated KeyVault calls (discover authenticator from chain, session defaults)
 * - Explicit proof builders ({@code createAuthProof*}, verify probes, management ops)
 *
 * @typedef {import('../../../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 * @typedef {import('../../../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 * @typedef {import('../../../types/index.js').EncodeAuthProofInputOptions} EncodeAuthProofInputOptions
 * @typedef {import('../../../types/index.js').EncodeAuthProofOptionsResult} EncodeAuthProofOptionsResult
 * @typedef {import('../../../types/index.js').AuthProofFlowOptions} AuthProofFlowOptions
 * @typedef {import('../../../types/index.js').AuthActionInput} AuthActionInput
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../session/CredentialsSession.js').CredentialsSession} CredentialsSession
 * @typedef {import('./authenticators/registry.js').AuthProofFlowId} AuthProofFlowId
 * @typedef {import('./authenticators/types.js').BuiltinAuthenticatorSpec} BuiltinAuthenticatorSpec
 *
 * @module internal/auth/proof/AuthProofPipeline
 */

import { requireAddress } from '../../assert.js';
import { ValidationError } from '../../../errors/index.js';
import log from '../../logger.js';
import {
  assertAuthActionInput,
  buildAuthContext,
  resolveActionHash
} from '../context/createAuthContext.js';
import { buildAuthenticatorVerifyProbeAction } from '../context/actions/authenticator/authenticatorProbe.js';
import { collectProofInput } from '../authenticators/collectProofInput.js';
import { createBuiltinAuthenticatorRegistry } from '../authenticators/registry.js';

/**
 * @param {unknown} authProof
 * @returns {boolean}
 */
function isPreEncodedAuthProof(authProof) {
  return typeof authProof === 'string' || authProof instanceof Uint8Array;
}

/**
 * @public
 */
export class AuthProofPipeline {
  /**
   * @public
   * @param {Object} deps
   * @param {MonsteraConfigOptions} deps.config
   * @param {EthersAbstractProvider} deps.readProvider
   * @param {(keyVaultAddr: Address) => Promise<Address>} deps.getAuthenticatorAddr
   */
  constructor({ config, readProvider, getAuthenticatorAddr }) {
    this._config = config;
    this._readProvider = readProvider;
    this._getAuthenticatorAddr = getAuthenticatorAddr;
    this._registry = createBuiltinAuthenticatorRegistry(config.addresses);
  }

  /**
   * @public
   * @async
   * @param {Address} keyVaultAddr
   */
  async resolveByKeyVault(keyVaultAddr) {
    requireAddress(keyVaultAddr, 'keyVaultAddr');
    const authenticatorAddr = await this._getAuthenticatorAddr(keyVaultAddr);
    const spec = this._registry.getSpecByAuthenticatorAddr(authenticatorAddr);

    if (!spec) {
      throw new ValidationError(
        'No built-in encoder for this authenticator; pass authProof as hex bytes',
        'authenticatorAddr',
        authenticatorAddr
      );
    }

    return { authenticatorAddr, spec };
  }

  /**
   * @public
   * @param {AuthProofFlowId} flowId
   */
  resolveByFlowId(flowId) {
    const spec = this._registry.getSpecByFlowId(flowId);
    if (!spec) {
      throw new ValidationError('Unknown auth proof flow', 'flowId', flowId);
    }

    const authenticatorAddr = this._config.addresses[spec.addressKey];
    return { authenticatorAddr, spec };
  }

  /**
   * @private
   * @param {Address} authenticatorAddr
   * @param {Address} keyVaultAddr
   */
  _buildEncodeContext(authenticatorAddr, keyVaultAddr) {
    return {
      addresses: this._config.addresses,
      chainId: this._config.chainId,
      readProvider: this._readProvider,
      getAuthenticatorAddr: this._getAuthenticatorAddr,
      authenticatorAddr,
      keyVaultAddr
    };
  }

  /**
   * @private
   * @async
   * @param {BuiltinAuthenticatorSpec} spec
   * @param {Address} authenticatorAddr
   * @param {Record<string, unknown>} options
   * @param {AuthProofFlowOptions} flowOptions
   */
  async _resolveAction(spec, authenticatorAddr, options, flowOptions = {}) {
    const { useVerifyProbe = false } = flowOptions;
    const withConfig = spec.applyConfigDefaults(this._config, options);
    let action = options.action;
    let actionHash = options.actionHash;

    if (actionHash == null) {
      if (action == null && useVerifyProbe) {
        action = buildAuthenticatorVerifyProbeAction(
          /** @type {Address} */ (withConfig.authenticatorAddr ?? authenticatorAddr)
        );
      }
      actionHash = await resolveActionHash(
        {
          readProvider: this._readProvider,
          chainId: withConfig.chainId,
          keyVaultAddr: withConfig.keyVaultAddr
        },
        { action, actionHash }
      );
    } else if (flowOptions.includeAuthContext && action == null) {
      assertAuthActionInput(action);
    }

    return { action, actionHash, withConfig };
  }

  /**
   * @private
   * @async
   * @param {BuiltinAuthenticatorSpec} spec
   * @param {Address} authenticatorAddr
   * @param {Record<string, unknown>} proofInput
   * @param {AuthActionInput | undefined} action
   * @param {import('../../../types/index.js').Bytes32 | undefined} actionHash
   */
  async _encodeProofInput(spec, authenticatorAddr, proofInput, action, actionHash) {
    const withConfig = spec.applyConfigDefaults(this._config, proofInput);
    const keyVaultAddr = /** @type {Address} */ (withConfig.keyVaultAddr);
    const encodeCtx = this._buildEncodeContext(authenticatorAddr, keyVaultAddr);

    let resolvedActionHash = actionHash;
    if (resolvedActionHash == null) {
      resolvedActionHash = await resolveActionHash(encodeCtx, { action, actionHash });
    }

    const input = { ...withConfig, action, actionHash: resolvedActionHash };

    log.info('encoding auth proof', { encoderId: spec.id, keyVaultAddr });

    if (spec.prepareProofResult) {
      return spec.prepareProofResult(encodeCtx, input);
    }

    return spec.proofEncoder.encode(encodeCtx, input);
  }

  /**
   * Encode vault call options for KeyVault clients (Path: discover authenticator from chain).
   * 
   * authProof passed in as structured partial input 
   * authentciator is discovered on-chain from keyVaultAddr
   * session password/signer defaults are merged in
   * vault operation supplies the action via buildAction
   *
   * @public
   * @async
   * @param {Record<string, unknown>} resolved - Options after session address merge
   * @param {CredentialsSession | null} session
   * @param {(resolved: Record<string, unknown>) => AuthActionInput} [buildAction]
   * @returns {Promise<EncodeAuthProofOptionsResult>}
   */
  async encodeVaultCall(resolved, session, buildAction) {
    const { authProof, keyVaultAddr } = resolved;

    if (authProof != null && isPreEncodedAuthProof(authProof)) {
      return /** @type {EncodeAuthProofOptionsResult} */ (resolved);
    }

    if (authProof != null && (typeof authProof !== 'object' || Array.isArray(authProof))) {
      throw new ValidationError(
        'authProof must be a hex string, Uint8Array, or a plain object for built-in authenticators',
        'authProof',
        authProof
      );
    }

    const { authenticatorAddr, spec } = await this.resolveByKeyVault(
      /** @type {Address} */ (keyVaultAddr)
    );

    let proofInput = collectProofInput(spec, resolved);
    proofInput = spec.applySessionInput(session, proofInput);

    if (proofInput.action == null && typeof buildAction === 'function') {
      proofInput = { ...proofInput, action: buildAction(resolved) };
    } else if (proofInput.action == null && typeof buildAction !== 'function') {
      throw new ValidationError(
        'authProof.action is required for structured auth proofs on this call',
        'authProof',
        proofInput
      );
    }

    const encoded = await this._encodeProofInput(
      spec,
      authenticatorAddr,
      { keyVaultAddr, ...proofInput },
      /** @type {AuthActionInput} */ (proofInput.action),
      undefined
    );

    const authProofBytes = typeof encoded === 'object' && encoded != null && 'authProof' in encoded
      ? encoded.authProof
      : encoded;

    return {
      ...resolved,
      keyVaultAddr,
      authProof: /** @type {import('../../../types/index.js').Bytes} */ (authProofBytes)
    };
  }

  /**
   * Build a proof for an explicitly named authenticator flow (Path: caller picks flow).
   *
   * caller names the flow: password, walletSignature, dualFactor, minuteSignature, etc. 
   * input is validated (validatePrepareInput)
   * action/actionHash is resolved (resolveAction)
   * returns proof bytes (and optionally separate action context)
   * 
   * @public
   * @async
   * @param {AuthProofFlowId} flowId
   * @param {Record<string, unknown>} [options={}]
   * @param {AuthProofFlowOptions} [flowOptions={}]
   */
  async prepare(flowId, options = {}, flowOptions = {}) {
    const { includeAuthContext = false } = flowOptions;
    const { authenticatorAddr, spec } = this.resolveByFlowId(flowId);

    const proofInput = collectProofInput(spec, options);
    spec.validatePrepareInput({ ...options, ...proofInput });
    const { action, actionHash, withConfig } = await this._resolveAction(
      spec,
      authenticatorAddr,
      { ...options, ...proofInput },
      flowOptions
    );

    const proofResult = await this._encodeProofInput(
      spec,
      authenticatorAddr,
      withConfig,
      action,
      actionHash
    );

    const authContext = includeAuthContext
      ? buildAuthContext({
          target: action?.target ?? withConfig.keyVaultAddr,
          selector: action.selector,
          paramsHash: action.paramsHash,
          actionHash
        })
      : null;

    if (flowId === 'minuteSignature' && typeof proofResult === 'object' && proofResult != null) {
      return { resolved: withConfig, actionHash, ...proofResult, action: authContext };
    }

    return {
      resolved: withConfig,
      actionHash,
      authProof: proofResult,
      action: authContext
    };
  }

  /**
   * Low-level structured encode when the authenticator is already known (tests / advanced use).
   *
   * currently not called by production code
   * 
   * no session merge
   * no collectProofInput from full resolved options
   * structured authproof must already by in options
   * 
   * @public
   * @async
   * @param {EncodeAuthProofInputOptions} options
   * @returns {Promise<EncodeAuthProofOptionsResult>}
   */
  async encode(options) {
    const { authProof, keyVaultAddr, ...rest } = options;

    if (!authProof || isPreEncodedAuthProof(authProof)) {
      return options;
    }

    if (typeof authProof !== 'object' || Array.isArray(authProof)) {
      throw new ValidationError(
        'authProof must be a hex string, Uint8Array, or a plain object for built-in authenticators',
        'authProof',
        authProof
      );
    }

    const { authenticatorAddr, spec } = await this.resolveByKeyVault(keyVaultAddr);
    const encoded = await this._encodeProofInput(
      spec,
      authenticatorAddr,
      { keyVaultAddr, ...authProof },
      authProof.action,
      authProof.actionHash
    );

    const authProofBytes = typeof encoded === 'object' && encoded != null && 'authProof' in encoded
      ? encoded.authProof
      : encoded;

    return {
      ...rest,
      keyVaultAddr,
      authProof: /** @type {import('../../../types/index.js').Bytes} */ (authProofBytes)
    };
  }
}
