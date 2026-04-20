/**
 * PasswordAuthenticator — create-wallet {@code authConfig} (bytes32 hash).
 *
 * @typedef {import('../../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../../types/index.js').CreateWalletPasswordAuthConfig} CreateWalletPasswordAuthConfig
 */

import { requireBytes32 } from '../../../../internal/assert.js';

/** @type {{ id: string, encode: (authConfig: CreateWalletPasswordAuthConfig) => Bytes32 }} */
export const passwordAuthCreateWalletEncoder = {
  id: 'passwordAuth',

  /**
   * @param {CreateWalletPasswordAuthConfig} authConfig
   * @returns {Bytes32}
   * @throws {ValidationError} If passwordHash is not a valid 32-byte hex string
   */
  encode(authConfig) {
    const { passwordHash } = authConfig;
    requireBytes32(passwordHash, 'passwordHash');
    return passwordHash;
  }
};
