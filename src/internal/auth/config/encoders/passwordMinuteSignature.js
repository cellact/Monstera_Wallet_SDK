/**
 * Encoder for the {@code PasswordMinuteSignatureAuthenticator} create-wallet auth config.
 *
 * Shares the same on-chain layout as {@code PasswordAuthenticator} at creation time (a single
 * {@code bytes32} password hash), so this strategy delegates to
 * {@link passwordAuthCreateWalletEncoder} unchanged.
 *
 * @typedef {import('../../../../types/index.js').PasswordMinuteSignatureAuthConfigInputOptions} PasswordMinuteSignatureAuthConfigInputOptions
 * @typedef {import('../../../../types/index.js').EncodedAuthConfigPasswordMinuteSignature} EncodedAuthConfigPasswordMinuteSignature
 *
 * @module internal/auth/config/encoders/passwordMinuteSignature
 */

import { passwordAuthCreateWalletEncoder } from './password.js';

/**
 * Strategy registered against the PasswordMinuteSignatureAuthenticator address.
 *
 * @public
 * @readonly
 * @type {{ id: string, encode: (authConfig: PasswordMinuteSignatureAuthConfigInputOptions) => EncodedAuthConfigPasswordMinuteSignature }}
 */
export const passwordMinuteSignatureAuthCreateWalletEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * Validate the password hash and return it as the encoded {@code authConfig} bytes.
   *
   * @public
   * @param {PasswordMinuteSignatureAuthConfigInputOptions} authConfig - Structured input ({@code { passwordHash }})
   * @returns {EncodedAuthConfigPasswordMinuteSignature} The 32-byte password hash, unchanged
   * @throws {ValidationError} If {@code passwordHash} is not a 32-byte hex string (raised by the
   *   delegated password encoder)
   */
  encode(authConfig) {
    return passwordAuthCreateWalletEncoder.encode(authConfig);
  }
};
