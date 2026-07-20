/**
 * ApiKeySessionAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/apiKeySession
 */

import { requireBytes32 } from '../../validation/assert.js';
import { createApiKeySessionAuthConfig } from '../config/bytes.js';
import { createAuthProofApiKeySession } from '../proof/builders/apiKeySession.js';
import { createActionBoundEncoder } from '../proof/common.js';
import {
  createAuthenticatorSpec,
  requirePartialOrSession
} from './createAuthenticatorSpec.js';

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

/** @type {BuiltinAuthenticatorSpec} */
export const apiKeySessionAuthenticator = createAuthenticatorSpec({
  id: 'apiKeySessionAuth',
  flowId: 'apiKeySession',
  addressKey: 'apiKeySessionAuth',

  applySessionInput: requirePartialOrSession(
    'apiKeySecret',
    (session) => session.getApiKeySecret(),
    'authProof.apiKeySecret is required when no credentials session is active'
  ),

  collectKeys: ['apiKeySecret', 'mode', 'expiry', 'scopeMask'],
  mapFields: {
    apiKeySecret: true,
    mode: true,
    expiry: true,
    scopeMask: true
  },
  validate: (options) => requireBytes32(options.apiKeySecret, 'apiKeySecret'),

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

  configEncoder: (authConfig) =>
    createApiKeySessionAuthConfig(/** @type {Bytes32} */ (authConfig.apiKeySecret))
});
