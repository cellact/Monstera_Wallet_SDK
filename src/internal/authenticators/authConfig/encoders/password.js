/**
 * PasswordAuthenticator — create-wallet {@code authConfig} (bytes32 hash).
 *
 * @typedef {import('../../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../../types/index.js').CreateWalletPasswordAuthConfig} CreateWalletPasswordAuthConfig
 */

import { ethers } from 'ethers';
import { ValidationError } from '../../../../errors/index.js';

/** @type {{ id: string, encode: (authConfig: CreateWalletPasswordAuthConfig) => Bytes32 }} */
export const passwordAuthCreateWalletEncoder = {
  id: 'passwordAuth',

  /**
   * @param {CreateWalletPasswordAuthConfig} authConfig
   * @returns {Bytes32}
   */
  encode(authConfig) {
    const { passwordHash } = authConfig;
    if (!passwordHash || typeof passwordHash !== 'string' || !ethers.isHexString(passwordHash, 32)) {
      throw new ValidationError(
        'authConfig.passwordHash must be a 32-byte hex string (bytes32)',
        'authConfig',
        authConfig
      );
    }
    return passwordHash;
  }
};
