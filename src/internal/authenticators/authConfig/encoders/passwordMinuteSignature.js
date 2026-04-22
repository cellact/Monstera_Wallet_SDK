/**
 * PasswordMinuteSignatureAuthenticator — same bytes32 shape as password auth at creation.
 *
 * @typedef {import('../../../../types/index.js').PasswordMinuteSignatureAuthConfigInputOptions} PasswordMinuteSignatureAuthConfigInputOptions
 * @typedef {import('../../../../types/index.js').EncodedPasswordMinuteSignatureCreateWalletAuthConfig} EncodedPasswordMinuteSignatureCreateWalletAuthConfig
 */

import { passwordAuthCreateWalletEncoder } from './password.js';

/** @type {{ id: string, encode: (authConfig: PasswordMinuteSignatureAuthConfigInputOptions) => EncodedPasswordMinuteSignatureCreateWalletAuthConfig }} */
export const passwordMinuteSignatureAuthCreateWalletEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * @param {PasswordMinuteSignatureAuthConfigInputOptions} authConfig
   * @returns {EncodedPasswordMinuteSignatureCreateWalletAuthConfig}
   */
  encode(authConfig) {
    return passwordAuthCreateWalletEncoder.encode(authConfig);
  }
};
