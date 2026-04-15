/**
 * PasswordMinuteSignatureAuthenticator — same bytes32 shape as password auth at creation.
 */

import { passwordAuthCreateWalletEncoder } from './password.js';

/** @type {{ id: string, encode: (authConfig: Record<string, unknown>) => import('../../../types/index.js').Bytes }} */
export const passwordMinuteSignatureAuthCreateWalletEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * @param {Record<string, unknown>} authConfig
   * @returns {import('../../../types/index.js').Bytes}
   */
  encode(authConfig) {
    return passwordAuthCreateWalletEncoder.encode(authConfig);
  }
};
