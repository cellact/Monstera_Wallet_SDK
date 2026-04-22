/**
 * PasswordAuthenticator — create-wallet {@code authConfig} (bytes32 hash).
 *
 * @typedef {import('../../../../types/index.js').PasswordAuthConfigInputOptions} PasswordAuthConfigInputOptions
 * @typedef {import('../../../../types/index.js').EncodedAuthConfigPassword} EncodedAuthConfigPassword
 */

import { requireBytes32 } from '../../../../internal/assert.js';

/** @type {{ id: string, encode: (authConfig: PasswordAuthConfigInputOptions) => EncodedAuthConfigPassword }} */
export const passwordAuthCreateWalletEncoder = {
  id: 'passwordAuth',

  /**
   * @param {PasswordAuthConfigInputOptions} authConfig
   * @returns {EncodedAuthConfigPassword}
   * @throws {ValidationError} If passwordHash is not a valid 32-byte hex string
   */
  encode(authConfig) {
    const { passwordHash } = authConfig;
    requireBytes32(passwordHash, 'passwordHash');
    return passwordHash;
  }
};
