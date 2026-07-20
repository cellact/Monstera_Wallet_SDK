/**
 * Form Template Method for built-in authenticator specs.
 *
 * Builds a complete {@link BuiltinAuthenticatorSpec} from identity + hooks so each
 * authenticator file only declares what differs (session, collect keys, map fields,
 * validation, encoders).
 *
 * @module internal/auth/specs/createAuthenticatorSpec
 */

import { ValidationError } from '../../../errors/index.js';
import { requireAddress } from '../../validation/assert.js';
import { defaultProofDeadline, pickAuthProofPartial } from '../proof/common.js';

/**
 * Session hook: keep {@code field} when set; otherwise read it from the credentials session.
 *
 * @param {string} field
 * @param {(session: import('../session/ConnectSession.js').ConnectSession) => unknown} readFromSession
 * @param {string} missingMessage
 * @returns {(session: import('../session/ConnectSession.js').ConnectSession | null, partial: Record<string, unknown>) => Record<string, unknown>}
 */
export function requirePartialOrSession(field, readFromSession, missingMessage) {
  return (session, partial) => {
    if (partial[field] != null) {
      return partial;
    }
    if (!session) {
      throw new ValidationError(missingMessage, `authProof.${field}`, partial[field]);
    }
    const value = readFromSession(session);
    if (value == null) {
      throw new ValidationError(missingMessage, `authProof.${field}`, value);
    }
    return { ...partial, [field]: value };
  };
}

/**
 * Session hook: require {@code field} on the partial (no session fallback).
 *
 * @param {string} field
 * @param {string} missingMessage
 * @returns {(session: import('../session/ConnectSession.js').ConnectSession | null, partial: Record<string, unknown>) => Record<string, unknown>}
 */
export function requirePartialField(field, missingMessage) {
  return (_session, partial) => {
    if (partial[field] == null) {
      throw new ValidationError(missingMessage, `authProof.${field}`, partial[field]);
    }
    return partial;
  };
}

/**
 * @param {Record<string, unknown>} options
 * @param {string[]} keys
 * @param {Record<string, (partial: Record<string, unknown>, options: Record<string, unknown>) => unknown>} [resolve]
 * @returns {Record<string, unknown>}
 */
function _defaultCollectProofInput(options, keys, resolve = {}) {
  const partial = pickAuthProofPartial(options);
  /** @type {Record<string, unknown>} */
  const out = { ...partial };

  for (const key of keys) {
    out[key] = partial[key] ?? options[key];
  }

  for (const [key, resolver] of Object.entries(resolve)) {
    out[key] = resolver(partial, options);
  }

  return out;
}

/**
 * @param {Record<string, unknown>} resolved
 * @param {Address} authenticatorAddr
 * @param {Record<string, true | ((resolved: Record<string, unknown>) => unknown)>} mapFields
 * @returns {Record<string, unknown>}
 */
function _defaultMapSessionResolved(resolved, authenticatorAddr, mapFields) {
  /** @type {Record<string, unknown>} */
  const out = {
    keyVaultAddr: resolved.keyVaultAddr,
    authenticatorAddr
  };

  for (const [key, mapper] of Object.entries(mapFields)) {
    out[key] = typeof mapper === 'function' ? mapper(resolved) : resolved[key];
  }

  return out;
}

/**
 * @param {Object} def
 * @param {string} def.id
 * @param {string} def.flowId
 * @param {keyof ContractAddresses} def.addressKey
 * @param {boolean} [def.withDeadline=false]
 * @param {boolean} [def.includeAddresses=false]
 * @param {(session: import('../session/ConnectSession.js').ConnectSession | null, partial: Record<string, unknown>) => Record<string, unknown>} def.applySessionInput
 * @param {string[]} [def.collectKeys=[]]
 * @param {Record<string, (partial: Record<string, unknown>, options: Record<string, unknown>) => unknown>} [def.collectResolve]
 * @param {(options: Record<string, unknown>) => Record<string, unknown>} [def.collectProofInput]
 * @param {Record<string, true | ((resolved: Record<string, unknown>) => unknown)>} [def.mapFields={}]
 * @param {(resolved: Record<string, unknown>, authenticatorAddr: Address) => Record<string, unknown>} [def.mapSessionResolved]
 * @param {(options: Record<string, unknown>) => void} [def.validate]
 * @param {(options: Record<string, unknown>) => void} [def.validatePrepareInput]
 * @param {(config: MonsteraConfigOptions, options: Record<string, unknown>) => Record<string, unknown>} [def.applyConfigDefaults]
 * @param {KeyVaultAuthProofEncoder} def.proofEncoder
 * @param {CreateWalletAuthEncoder | ((authConfig: Record<string, unknown>) => Bytes)} def.configEncoder
 * @param {(encodeCtx: AuthProofEncodeContext, input: Record<string, unknown>) => Promise<unknown>} [def.prepareProofResult]
 * @returns {BuiltinAuthenticatorSpec}
 */
export function createAuthenticatorSpec(def) {
  const {
    id,
    flowId,
    addressKey,
    withDeadline = false,
    includeAddresses = false,
    applySessionInput,
    collectKeys = [],
    collectResolve,
    collectProofInput: collectProofInputOverride,
    mapFields = {},
    mapSessionResolved: mapSessionResolvedOverride,
    validate,
    validatePrepareInput: validatePrepareInputOverride,
    applyConfigDefaults: applyConfigDefaultsOverride,
    proofEncoder,
    configEncoder,
    prepareProofResult
  } = def;

  const normalizedConfigEncoder =
    typeof configEncoder === 'function'
      ? { id, encode: configEncoder }
      : configEncoder;

  /** @type {BuiltinAuthenticatorSpec} */
  const spec = {
    id,
    flowId,
    addressKey,

    applySessionInput,

    collectProofInput:
      collectProofInputOverride ??
      ((options) => _defaultCollectProofInput(options, collectKeys, collectResolve)),

    mapSessionResolved:
      mapSessionResolvedOverride ??
      ((resolved, authenticatorAddr) =>
        _defaultMapSessionResolved(resolved, authenticatorAddr, mapFields)),

    applyConfigDefaults:
      applyConfigDefaultsOverride ??
      ((config, options) => ({
        ...options,
        ...(includeAddresses
          ? { addresses: options.addresses ?? config.addresses }
          : {}),
        authenticatorAddr: options.authenticatorAddr ?? config.addresses[addressKey],
        ...(withDeadline ? { deadline: options.deadline ?? defaultProofDeadline() } : {}),
        chainId: config.chainId
      })),

    validatePrepareInput:
      validatePrepareInputOverride ??
      ((options) => {
        requireAddress(options.keyVaultAddr, 'keyVaultAddr');
        validate?.(options);
      }),

    proofEncoder,
    configEncoder: normalizedConfigEncoder
  };

  if (prepareProofResult) {
    spec.prepareProofResult = prepareProofResult;
  }

  return spec;
}
