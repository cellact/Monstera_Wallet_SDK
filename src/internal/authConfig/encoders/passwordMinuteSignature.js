/**
 * PasswordMinuteSignatureAuthenticator — same bytes32 shape as password auth at creation.
 *
 * @typedef {import('../../../types/index.js').Bytes} Bytes
 */

import { passwordAuthCreateWalletEncoder } from './password.js';

/** @type {{ id: string, encode: (authConfig: Record<string, unknown>) => Bytes }} */
export const passwordMinuteSignatureAuthCreateWalletEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * @param {Record<string, unknown>} authConfig
   * @returns {Bytes}
   */
  encode(authConfig) {
    return passwordAuthCreateWalletEncoder.encode(authConfig);
  }
};
