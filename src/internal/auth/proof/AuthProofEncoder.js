/**
 * Unified auth-proof pipeline for all built-in authenticators.
 *
 * @description Single entry point for:
 * - Vault-authenticated KeyVault calls (discover authenticator from chain, session defaults)
 * - Explicit proof builders ({@code createAuthProof*}, verify probes, management ops)
 *
 * @typedef {import('../session/ConnectSession.js').ConnectSession} ConnectSession
 *
 * @module internal/auth/proof/AuthProofEncoder
 */

import { requireAddress, requirePlainObject } from '../../validation/assert.js';
import { ValidationError } from '../../../errors/index.js';
import {
  assertAuthActionInput,
  buildAuthContext,
  resolveActionHash
} from '../context/actionContext.js';
import { buildAuthenticatorVerifyProbeAction } from '../probes/verifyProbe.js';
import { createBuiltinAuthenticatorRegistry } from '../specs/registry.js';
import {
  logAuthProofEncoded,
  logExplicitAuthPrepare,
  logVaultAuthPreEncoded,
  logVaultAuthResolved
} from './logging.js';

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
export class AuthProofEncoder {
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
   * @param {Bytes32 | undefined} actionHash
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

    if (spec.prepareProofResult) {
      const result = await spec.prepareProofResult(encodeCtx, input);
      logAuthProofEncoded({
        encoderId: spec.id,
        flowId: spec.flowId,
        authenticatorAddr,
        keyVaultAddr,
        proofInput: input,
        action,
        authProof: typeof result === 'object' && result != null && 'authProof' in result ? result.authProof : result
      });
      return result;
    }

    const authProof = await spec.proofEncoder.encode(encodeCtx, input);
    logAuthProofEncoded({
      encoderId: spec.id,
      flowId: spec.flowId,
      authenticatorAddr,
      keyVaultAddr,
      proofInput: input,
      action,
      authProof
    });
    return authProof;
  }

  /**
   * Merge structured proof input: collect → session defaults → action from {@code buildAction}.
   *
   * @private
   * @param {BuiltinAuthenticatorSpec} spec
   * @param {Record<string, unknown>} resolved
   * @param {ConnectSession | null} session
   * @param {(resolved: Record<string, unknown>) => AuthActionInput} [buildAction]
   * @returns {Record<string, unknown>}
   */
  _mergeProofInput(spec, resolved, session, buildAction) {
    let proofInput = spec.collectProofInput(resolved);
    proofInput = spec.applySessionInput(session, {
      ...proofInput,
      addresses: this._config.addresses
    });

    if (proofInput.action == null && typeof buildAction === 'function') {
      proofInput = { ...proofInput, action: buildAction(resolved) };
    } else if (proofInput.action == null && typeof buildAction !== 'function') {
      throw new ValidationError(
        'authProof.action is required for structured auth proofs on this call',
        'authProof',
        proofInput
      );
    }

    return proofInput;
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
   * @param {ConnectSession | null} session
   * @param {(resolved: Record<string, unknown>) => AuthActionInput} [buildAction]
   * @returns {Promise<EncodeAuthProofOptionsResult>}
   */
  async encodeForKeyVault(resolved, session, buildAction) {
    const { authProof, keyVaultAddr } = resolved;

    if (authProof != null && isPreEncodedAuthProof(authProof)) {
      logVaultAuthPreEncoded({ keyVaultAddr: /** @type {Address} */ (keyVaultAddr) });
      return /** @type {EncodeAuthProofOptionsResult} */ (resolved);
    }

    if (authProof != null && !isPreEncodedAuthProof(authProof)) {
      requirePlainObject(authProof, 'authProof', {
        message:
          'authProof must be a hex string, Uint8Array, or a plain object for built-in authenticators'
      });
    }

    const { authenticatorAddr, spec } = await this.resolveByKeyVault(
      /** @type {Address} */ (keyVaultAddr)
    );

    const proofInput = this._mergeProofInput(spec, resolved, session, buildAction);

    logVaultAuthResolved({
      encoderId: spec.id,
      flowId: spec.flowId,
      authenticatorAddr,
      keyVaultAddr: /** @type {Address} */ (keyVaultAddr),
      proofInput
    });

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
      authProof: /** @type {Bytes} */ (authProofBytes)
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
  async encodeForFlow(flowId, options = {}, flowOptions = {}) {
    const { includeAuthContext = false } = flowOptions;
    const { authenticatorAddr, spec } = this.resolveByFlowId(flowId);

    logExplicitAuthPrepare({
      flowId,
      encoderId: spec.id,
      authenticatorAddr,
      keyVaultAddr: /** @type {Address | undefined} */ (options.keyVaultAddr),
      flowOptions
    });

    const proofInput = spec.collectProofInput(options);
    const withDefaults = spec.applyConfigDefaults(this._config, { ...options, ...proofInput });
    spec.validatePrepareInput(withDefaults);
    const { action, actionHash, withConfig } = await this._resolveAction(
      spec,
      authenticatorAddr,
      withDefaults,
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
   * no spec.collectProofInput from full resolved options
   * structured authproof must already by in options
   * 
   * @public
   * @async
   * @param {EncodeAuthProofInputOptions} options
   * @returns {Promise<EncodeAuthProofOptionsResult>}
   */
  async encode(options) { // TODO: check if this is used anywhere in production code
    const { authProof, keyVaultAddr, ...rest } = options;

    if (!authProof || isPreEncodedAuthProof(authProof)) {
      return options;
    }

    requirePlainObject(authProof, 'authProof', {
      message:
        'authProof must be a hex string, Uint8Array, or a plain object for built-in authenticators'
    });

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
      authProof: /** @type {Bytes} */ (authProofBytes)
    };
  }
}
