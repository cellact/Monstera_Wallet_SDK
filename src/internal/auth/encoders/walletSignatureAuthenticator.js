/**
 * WalletSignatureAuthenticator — create-wallet config and KeyVault authProof encoders.
 *
 * @module internal/auth/encoders/walletSignatureAuthenticator
 */

import { createAuthProofWalletSignature } from '../proof/createAuthProof.js';
import { createWalletSigAuthConfig } from '../config/createAuthConfig.js';
import { bindProofToAction } from '../proof/bindProofToAction.js';

/** @type {import('../../../types/index.js').KeyVaultAuthProofEncoder} */
export const walletSignatureKeyVaultAuthProofEncoder = bindProofToAction({
  id: 'walletSignatureAuth',
  withDeadline: true,
  createProof: ({
    signer,
    chainId,
    authenticatorAddr,
    keyVaultAddr,
    deadline,
    actionHash
  }) =>
    createAuthProofWalletSignature({
      signer,
      chainId,
      authenticatorAddr,
      deadline,
      keyVaultAddr,
      actionHash
    })
});

/**
 * @public
 * @readonly
 * @type {{ id: string, encode: (authConfig: import('../../../types/index.js').WalletSignatureAuthConfigInputOptions) => import('../../../types/index.js').EncodedAuthConfigWalletSignature }}
 */
export const walletSignatureAuthCreateWalletEncoder = {
  id: 'walletSignatureAuth',

  encode(authConfig) {
    const { initialWhitelist } = authConfig;
    return createWalletSigAuthConfig(/** @type {import('../../../types/index.js').Address[]} */ (initialWhitelist));
  }
};
