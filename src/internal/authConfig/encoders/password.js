/**
 * PasswordAuthenticator — create-wallet {@code authConfig} (bytes32 hash).
 */

import { ethers } from 'ethers';
import { ValidationError } from '../../../errors/index.js';

/** @type {{ id: string, encode: (authConfig: Record<string, unknown>) => import('../../../types/index.js').Bytes }} */
export const passwordAuthCreateWalletEncoder = {
  id: 'passwordAuth',

  /**
   * @param {Record<string, unknown>} authConfig
   * @returns {import('../../../types/index.js').Bytes}
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
