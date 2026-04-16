/**
 * PasswordMinuteSignatureAuthenticator — same bytes32 shape as password auth at creation.
 *
 * @typedef {import('../../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../../types/index.js').CreateWalletPasswordMinuteSignatureAuthConfig} CreateWalletPasswordMinuteSignatureAuthConfig
 */

import { passwordAuthCreateWalletEncoder } from './password.js';

/** @type {{ id: string, encode: (authConfig: CreateWalletPasswordMinuteSignatureAuthConfig) => Bytes32 }} */
export const passwordMinuteSignatureAuthCreateWalletEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * @param {CreateWalletPasswordMinuteSignatureAuthConfig} authConfig
   * @returns {Bytes32}
   */
  encode(authConfig) {
    return passwordAuthCreateWalletEncoder.encode(authConfig);
  }
};
