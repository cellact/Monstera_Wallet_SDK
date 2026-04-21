/**
 * PasswordMinuteSignatureAuthenticator — same bytes32 shape as password auth at creation.
 *
 * @typedef {import('../../../../types/index.js').CreateWalletPasswordMinuteSignatureAuthConfig} CreateWalletPasswordMinuteSignatureAuthConfig
 * @typedef {import('../../../../types/index.js').EncodedPasswordMinuteSignatureCreateWalletAuthConfig} EncodedPasswordMinuteSignatureCreateWalletAuthConfig
 */

import { passwordAuthCreateWalletEncoder } from './password.js';

/** @type {{ id: string, encode: (authConfig: CreateWalletPasswordMinuteSignatureAuthConfig) => EncodedPasswordMinuteSignatureCreateWalletAuthConfig }} */
export const passwordMinuteSignatureAuthCreateWalletEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * @param {CreateWalletPasswordMinuteSignatureAuthConfig} authConfig
   * @returns {EncodedPasswordMinuteSignatureCreateWalletAuthConfig}
   */
  encode(authConfig) {
    return passwordAuthCreateWalletEncoder.encode(authConfig);
  }
};
