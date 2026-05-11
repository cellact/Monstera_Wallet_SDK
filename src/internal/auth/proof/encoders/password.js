/**
 * Encoder for the {@code PasswordAuthenticator} KeyVault {@code authProof}.
 *
 * The contract verifies the auth proof by hashing it with {@code keccak256} and comparing against
 * the stored password hash; the proof bytes are therefore the raw UTF-8 password bytes. Callers
 * MUST pass the password as a {@link Uint8Array} (typically via {@code ethers.toUtf8Bytes}) — this
 * encoder does NOT do the UTF-8 encoding itself, both to keep the contract free of plaintext
 * string traffic and to make sanitisation easier.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').AuthProofEncodeContext} AuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').PasswordAuthProofInputOptions} PasswordAuthProofInputOptions
 * @typedef {import('../../../../types/index.js').PasswordAuthProofEncoderOptions} PasswordAuthProofEncoderOptions
 *
 * @module internal/auth/proof/encoders/password
 */

import { hexlify } from '../../../../adapters/ethers/hashing.js';
import { requireUtf8Bytes } from '../../../../internal/assert.js';

/**
 * Strategy registered against the PasswordAuthenticator address.
 *
 * @public
 * @readonly
 * @type {PasswordAuthProofEncoderOptions}
 */
export const passwordKeyVaultAuthProofEncoder = {
  id: 'passwordAuth',

  /**
   * Encode the password bytes as a hex string.
   *
   * @public
   * @async
   * @param {AuthProofEncodeContext} _ctx - Unused (encoder interface contract); see
   *   {@link AuthProofBuilder.encode}
   * @param {PasswordAuthProofInputOptions} input - Structured input ({@code { password: Uint8Array }})
   * @returns {Promise<Bytes>} {@code 0x}-prefixed hex string of the password bytes
   * @throws {ValidationError} If {@code input.password} is not a non-empty {@link Uint8Array}
   *   (raised by {@link requireUtf8Bytes})
   */
  async encode(_ctx, input) {
    const bytes = input.password;
    requireUtf8Bytes(bytes, 'password');
    return hexlify(bytes);
  }
};
