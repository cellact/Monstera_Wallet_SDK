/**
 * PasswordAuthenticator — create-wallet {@code authConfig} (bytes32 hash).
 *
 * @typedef {import('../../../../types/index.js').CreateWalletPasswordAuthConfig} CreateWalletPasswordAuthConfig
 * @typedef {import('../../../../types/index.js').EncodedPasswordAuthenticatorCreateWalletAuthConfig} EncodedPasswordAuthenticatorCreateWalletAuthConfig
 */

import { requireBytes32 } from '../../../../internal/assert.js';

/** @type {{ id: string, encode: (authConfig: CreateWalletPasswordAuthConfig) => EncodedPasswordAuthenticatorCreateWalletAuthConfig }} */
export const passwordAuthCreateWalletEncoder = {
  id: 'passwordAuth',

  /**
   * @param {CreateWalletPasswordAuthConfig} authConfig
   * @returns {EncodedPasswordAuthenticatorCreateWalletAuthConfig}
   * @throws {ValidationError} If passwordHash is not a valid 32-byte hex string
   */
  encode(authConfig) {
    const { passwordHash } = authConfig;
    requireBytes32(passwordHash, 'passwordHash');
    return passwordHash;
  }
};
