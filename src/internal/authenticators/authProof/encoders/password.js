/**
 * PasswordAuthenticator — KeyVault {@code authProof} is UTF-8 password bytes (as hex).
 * Expects {@code password} as {@link Uint8Array} (e.g. from {@code ethers.toUtf8Bytes} at the call site). This module does not UTF-8 encode plaintext strings.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofEncodeContext} KeyVaultAuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').KeyVaultPasswordAuthProofInput} KeyVaultPasswordAuthProofInput
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofPasswordEncoder} KeyVaultAuthProofPasswordEncoder
 */

import { ethers } from 'ethers';
import { requireUtf8Bytes } from '../../../../internal/assert.js';

/** @type {KeyVaultAuthProofPasswordEncoder} */
export const passwordKeyVaultAuthProofEncoder = {
  id: 'passwordAuth',

  /**
   * @param {KeyVaultAuthProofEncodeContext} _ctx - Unused; encoder interface passes encode context from the registry
   * @param {KeyVaultPasswordAuthProofInput} input
   * @returns {Promise<Bytes>}
   * @throws {ValidationError} If password is not a valid Uint8Array
   */
  async encode(_ctx, input) {
    const bytes = input.password;
    requireUtf8Bytes(bytes, 'password');
    return ethers.hexlify(bytes);
  }
};
