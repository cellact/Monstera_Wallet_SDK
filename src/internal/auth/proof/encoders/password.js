/**
 * Encoder for the {@code PasswordAuthenticator} KeyVault {@code authProof}.
 *
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofEncoder} KeyVaultAuthProofEncoder
 *
 * @module internal/auth/proof/encoders/password
 */

import { createAuthProofPassword } from '../../../crypto/index.js';
import { requireUtf8Bytes } from '../../../../internal/assert.js';
import { createActionBoundProofEncoder } from '../createActionBoundProofEncoder.js';

/** @type {KeyVaultAuthProofEncoder} */
export const passwordKeyVaultAuthProofEncoder = createActionBoundProofEncoder({
  id: 'passwordAuth',
  validateInput: ({ password }) => requireUtf8Bytes(password, 'password'),
  createProof: ({ password, actionHash }) => createAuthProofPassword({ password, actionHash })
});
