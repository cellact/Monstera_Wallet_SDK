/**
 * Encoder for the {@code PasswordAuthenticator} create-wallet auth config.
 *
 * The contract expects the {@code authConfig} bytes to be exactly the 32-byte password hash;
 * this encoder simply validates the hash and returns it unchanged.
 *
 * @typedef {import('../../../../types/index.js').PasswordAuthConfigInputOptions} PasswordAuthConfigInputOptions
 * @typedef {import('../../../../types/index.js').EncodedAuthConfigPassword} EncodedAuthConfigPassword
 *
 * @module internal/auth/config/encoders/password
 */

import { requireBytes32 } from '../../../../internal/assert.js';

/**
 * Strategy registered against the PasswordAuthenticator address.
 *
 * @public
 * @readonly
 * @type {{ id: string, encode: (authConfig: PasswordAuthConfigInputOptions) => EncodedAuthConfigPassword }}
 */
export const passwordAuthCreateWalletEncoder = {
  id: 'passwordAuth',

  /**
   * Validate and return the password-hash bytes as-is.
   *
   * @public
   * @param {PasswordAuthConfigInputOptions} authConfig - Structured input ({@code { passwordHash }})
   * @returns {EncodedAuthConfigPassword} The 32-byte hash, unchanged
   * @throws {ValidationError} If {@code passwordHash} is not a 32-byte {@code 0x}-prefixed hex string
   */
  encode(authConfig) {
    const { passwordHash } = authConfig;
    requireBytes32(passwordHash, 'passwordHash');
    return passwordHash;
  }
};
