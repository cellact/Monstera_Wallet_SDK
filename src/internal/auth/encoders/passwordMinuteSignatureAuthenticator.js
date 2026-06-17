/**
 * PasswordMinuteSignatureAuthenticator — create-wallet config and KeyVault authProof encoders.
 *
 * @module internal/auth/encoders/passwordMinuteSignatureAuthenticator
 */

import { createAuthProofMinuteSignature } from '../proof/createAuthProof.js';
import { passwordAuthCreateWalletEncoder } from './passwordAuthenticator.js';
import { bindProofToAction } from '../proof/bindProofToAction.js';

/** @type {import('../../../types/index.js').KeyVaultAuthProofEncoder} */
export const passwordMinuteSignatureKeyVaultAuthProofEncoder = bindProofToAction({
  id: 'passwordMinuteSignatureAuth',
  createProof: async ({
    readProvider,
    keyVaultAddr,
    authenticatorAddr,
    chainId,
    passwordHash,
    actionHash
  }) => {
    const result = await createAuthProofMinuteSignature({
      provider: readProvider,
      keyVaultAddr,
      authenticatorAddr,
      chainId,
      passwordHash,
      actionHash
    });
    return result.authProof;
  }
});

/**
 * @public
 * @readonly
 * @type {{ id: string, encode: (authConfig: import('../../../types/index.js').PasswordMinuteSignatureAuthConfigInputOptions) => import('../../../types/index.js').EncodedAuthConfigPasswordMinuteSignature }}
 */
export const passwordMinuteSignatureAuthCreateWalletEncoder = {
  id: 'passwordMinuteSignatureAuth',

  encode(authConfig) {
    return passwordAuthCreateWalletEncoder.encode(authConfig);
  }
};
