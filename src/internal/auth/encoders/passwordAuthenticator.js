/**
 * PasswordAuthenticator — create-wallet config and KeyVault authProof encoders.
 *
 * @module internal/auth/encoders/passwordAuthenticator
 */

import { createAuthProofPassword } from '../proof/createAuthProof.js';
import { requireUtf8Bytes, requireBytes32 } from '../../assert.js';
import { bindProofToAction } from '../proof/bindProofToAction.js';

/** @type {import('../../../types/index.js').KeyVaultAuthProofEncoder} */
export const passwordKeyVaultAuthProofEncoder = bindProofToAction({
  id: 'passwordAuth',
  validateInput: ({ password }) => requireUtf8Bytes(password, 'password'),
  createProof: ({ password, actionHash }) => createAuthProofPassword({ password, actionHash })
});

/**
 * @public
 * @readonly
 * @type {{ id: string, encode: (authConfig: import('../../../types/index.js').PasswordAuthConfigInputOptions) => import('../../../types/index.js').EncodedAuthConfigPassword }}
 */
export const passwordAuthCreateWalletEncoder = {
  id: 'passwordAuth',

  encode(authConfig) {
    const { passwordHash } = authConfig;
    requireBytes32(passwordHash, 'passwordHash');
    return passwordHash;
  }
};
