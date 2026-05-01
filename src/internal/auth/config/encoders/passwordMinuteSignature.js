/**
 * PasswordMinuteSignatureAuthenticator — same bytes32 shape as password auth at creation.
 *
 * @typedef {import('../../../../types/index.js').PasswordMinuteSignatureAuthConfigInputOptions} PasswordMinuteSignatureAuthConfigInputOptions
 * @typedef {import('../../../../types/index.js').EncodedAuthConfigPasswordMinuteSignature} EncodedAuthConfigPasswordMinuteSignature
 */

import { passwordAuthCreateWalletEncoder } from './password.js';

/** @type {{ id: string, encode: (authConfig: PasswordMinuteSignatureAuthConfigInputOptions) => EncodedAuthConfigPasswordMinuteSignature }} */
export const passwordMinuteSignatureAuthCreateWalletEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * @param {PasswordMinuteSignatureAuthConfigInputOptions} authConfig
   * @returns {EncodedAuthConfigPasswordMinuteSignature}
   */
  encode(authConfig) {
    return passwordAuthCreateWalletEncoder.encode(authConfig);
  }
};
