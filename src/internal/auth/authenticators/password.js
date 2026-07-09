/**
 * PasswordAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/authenticators/password
 */

import { ValidationError } from '../../../errors/index.js';
import { requireBytes32, requireUtf8Bytes, requireAddress } from '../../assert.js';
import { bindProofToAction } from '../proof/bindProofToAction.js';
import { createAuthProofPassword } from '../proof/createAuthProof.js';

/**
 * @param {import('../session/CredentialsSession.js').CredentialsSession | null} session
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
 * @param {import('../../../types/index.js').MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    chainId: config.chainId,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.passwordAuth
  };
}

/** @type {import('./types.js').BuiltinAuthenticatorSpec} */
export const passwordAuthenticator = {
  id: 'passwordAuth',
  flowId: 'password',
  addressKey: 'passwordAuth',

  applySessionInput,
  applyConfigDefaults,
  validatePrepareInput,

  proofEncoder: bindProofToAction({
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
