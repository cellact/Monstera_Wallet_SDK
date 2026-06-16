/**
 * Encoder for the {@code WalletSignatureAuthenticator} KeyVault {@code authProof}.
 *
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofEncoder} KeyVaultAuthProofEncoder
 *
 * @module internal/auth/proof/encoders/walletSignature
 */

import { createAuthProofWalletSignature } from '../../../crypto/index.js';
import { createActionBoundProofEncoder } from '../createActionBoundProofEncoder.js';

/** @type {KeyVaultAuthProofEncoder} */
export const walletSignatureKeyVaultAuthProofEncoder = createActionBoundProofEncoder({
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
