/**
 * PasswordAuthenticator — KeyVault {@code authProof} is UTF-8 password bytes (as hex).
 * Expects {@code password} as {@link Uint8Array} (e.g. from {@code ethers.toUtf8Bytes} at the call site). This module does not UTF-8 encode plaintext strings.
 */

import { ethers } from 'ethers';
import { ValidationError } from '../../../../errors/index.js';

/** @type {{ id: string, encode: (ctx: object, input: Record<string, unknown>) => Promise<string> }} */
export const passwordKeyVaultAuthProofEncoder = {
  id: 'passwordAuth',

  /**
   * @param {object} _ctx
   * @param {Record<string, unknown>} input
   */
  async encode(_ctx, input) {
    const bytes = input.password;
    if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
      throw new ValidationError(
        'authProof requires password as Uint8Array (e.g. ethers.toUtf8Bytes); the SDK does not UTF-8 encode plaintext strings',
        'authProof',
        input
      );
    }
    return ethers.hexlify(bytes);
  }
};
