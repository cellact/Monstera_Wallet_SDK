/**
 * PasswordAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/password
 */

import { ValidationError } from '../../../errors/index.js';
import { requireBytes32, requireUtf8Bytes, requireAddress } from '../../validation/assert.js';
import { createActionBoundEncoder } from '../encoding/createActionBoundEncoder.js';
import { createAuthProofPassword } from '../encoding/createAuthProof.js';
import { pickAuthProofPartial } from '../encoding/proofDefaults.js';

/**
 * @param {import('../session/ConnectSession.js').ConnectSession | null} session
 * @param {Record<string, unknown>} partial
 * @returns {Record<string, unknown>}
 */
function applySessionInput(session, partial) {
  if (partial.password != null) {
    return partial;
  }
  if (!session) {
    throw new ValidationError(
      'authProof.password is required when no credentials session is active',
      'authProof.password',
      partial.password
    );
  }
  return { ...partial, password: session.getPasswordBytes() };
}

/**
 * @param {Record<string, unknown>} options
 */
function validatePrepareInput(options) {
  requireAddress(options.keyVaultAddr, 'keyVaultAddr');
  requireUtf8Bytes(options.password, 'password');
}

/**
 * @param {MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    chainId: config.chainId,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.passwordAuth
  };
}

/**
 * @param {Record<string, unknown>} options
 * @returns {Record<string, unknown>}
 */
function collectProofInput(options) {
  const partial = pickAuthProofPartial(options);
  return { ...partial, password: partial.password ?? options.password };
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
    password: resolved.currentPassword ?? resolved.password
  };
}

/** @type {import('./types.js').BuiltinAuthenticatorSpec} */
export const passwordAuthenticator = {
  id: 'passwordAuth',
  flowId: 'password',
  addressKey: 'passwordAuth',

  applySessionInput,
  collectProofInput,
  mapSessionResolved,
  applyConfigDefaults,
  validatePrepareInput,

  proofEncoder: createActionBoundEncoder({
    id: 'passwordAuth',
    validateInput: ({ password }) => requireUtf8Bytes(password, 'password'),
    createProof: ({ password, actionHash }) => createAuthProofPassword({ password, actionHash })
  }),

  configEncoder: {
    id: 'passwordAuth',
    encode(authConfig) {
      const { passwordHash } = authConfig;
      requireBytes32(passwordHash, 'passwordHash');
      return passwordHash;
    }
  }
};
