/**
 * ApiKeySessionAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/apiKeySession
 */

import { ValidationError } from '../../../errors/index.js';
import { requireAddress, requireBytes32 } from '../../validation/assert.js';
import { createApiKeySessionAuthConfig } from '../config/bytes.js';
import { createAuthProofApiKeySession } from '../proof/builders/apiKeySession.js';
import { createActionBoundEncoder, pickAuthProofPartial } from '../proof/common.js';

/** TOKEN-mode proof ({@code mode = 1}). */
export const MODE_TOKEN = 1;

/** ACTION-mode proof ({@code mode = 2}). */
export const MODE_ACTION = 2;

/** Bits 0–4: all KeyVault signing ops, excluding {@code executeWithAuth}. */
export const SCOPE_SIGN_ALL = 31;

/** Bits 0–5: all signing ops plus {@code executeWithAuth}. */
export const SCOPE_ALL = 63;

/**
 * @param {Record<string, unknown>} input
 * @returns {boolean}
 */
export function isApiKeySessionTokenMode(input) {
  if (input.mode === 'action') {
    return false;
  }
  if (input.mode === 'token') {
    return true;
  }
  return input.expiry != null || input.scopeMask != null;
}

/**
 * @param {import('../session/ConnectSession.js').ConnectSession | null} session
 * @param {Record<string, unknown>} partial
 */
function applySessionInput(session, partial) {
  const merged = {
    ...partial,
    apiKeySecret: partial.apiKeySecret ?? session?.getApiKeySecret()
  };

  if (merged.apiKeySecret == null) {
    throw new ValidationError(
      'authProof.apiKeySecret is required when no credentials session is active',
      'authProof.apiKeySecret',
      merged.apiKeySecret
    );
  }

  return merged;
}

/**
 * @param {Record<string, unknown>} options
 */
function validatePrepareInput(options) {
  requireAddress(options.keyVaultAddr, 'keyVaultAddr');
  requireBytes32(options.apiKeySecret, 'apiKeySecret');
}

/**
 * @param {MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.apiKeySessionAuth,
    chainId: config.chainId
  };
}

/**
 * @param {Record<string, unknown>} options
 * @returns {Record<string, unknown>}
 */
function collectProofInput(options) {
  const partial = pickAuthProofPartial(options);
  return {
    ...partial,
    apiKeySecret: partial.apiKeySecret ?? options.apiKeySecret,
    mode: partial.mode ?? options.mode,
    expiry: partial.expiry ?? options.expiry,
    scopeMask: partial.scopeMask ?? options.scopeMask
  };
}

/**
 * @param {Record<string, unknown>} resolved
 * @param {Address} authenticatorAddr
 * @returns {Record<string, unknown>}
 */
function mapSessionResolved(resolved, authenticatorAddr) {
  return {
    keyVaultAddr: resolved.keyVaultAddr,
    authenticatorAddr,
    apiKeySecret: resolved.apiKeySecret,
    mode: resolved.mode,
    expiry: resolved.expiry,
    scopeMask: resolved.scopeMask
  };
}

/** @type {BuiltinAuthenticatorSpec} */
export const apiKeySessionAuthenticator = {
  id: 'apiKeySessionAuth',
  flowId: 'apiKeySession',
  addressKey: 'apiKeySessionAuth',

  applySessionInput,
  collectProofInput,
  mapSessionResolved,
  applyConfigDefaults,
  validatePrepareInput,

  proofEncoder: createActionBoundEncoder({
    id: 'apiKeySessionAuth',
    validateInput: ({ apiKeySecret }) => requireBytes32(apiKeySecret, 'apiKeySecret'),
    createProof: (input) =>
      createAuthProofApiKeySession({
        readProvider: input.readProvider,
        authenticatorAddr: input.authenticatorAddr,
        apiKeySecret: input.apiKeySecret,
        keyVaultAddr: input.keyVaultAddr,
        chainId: input.chainId,
        actionHash: input.actionHash,
        mode: input.mode,
        expiry: input.expiry,
        scopeMask: input.scopeMask
      })
  }),

  configEncoder: {
    id: 'apiKeySessionAuth',
    encode(authConfig) {
      const { apiKeySecret } = authConfig;
      return createApiKeySessionAuthConfig(
        /** @type {Bytes32} */ (apiKeySecret)
      );
    }
  }
};
