/**
 * PasswordAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/password
 */

import { requireBytes32, requireUtf8Bytes } from '../../validation/assert.js';
import { createActionBoundEncoder } from '../proof/common.js';
import { createAuthProofPassword } from '../proof/builders/abiProofs.js';
import {
  createAuthenticatorSpec,
  requirePartialOrSession
} from './createAuthenticatorSpec.js';

/** @type {BuiltinAuthenticatorSpec} */
export const passwordAuthenticator = createAuthenticatorSpec({
  id: 'passwordAuth',
  flowId: 'password',
  addressKey: 'passwordAuth',

  applySessionInput: requirePartialOrSession(
    'password',
    (session) => session.getPasswordBytes(),
    'authProof.password is required when no credentials session is active'
  ),

  collectKeys: ['password'],
  mapFields: {
    password: (resolved) => resolved.currentPassword ?? resolved.password
  },
  validate: (options) => requireUtf8Bytes(options.password, 'password'),

  proofEncoder: createActionBoundEncoder({
    id: 'passwordAuth',
    validateInput: ({ password }) => requireUtf8Bytes(password, 'password'),
    createProof: ({ password, actionHash }) => createAuthProofPassword({ password, actionHash })
  }),

  configEncoder: (authConfig) => {
    const { passwordHash } = authConfig;
    requireBytes32(passwordHash, 'passwordHash');
    return passwordHash;
  }
});
