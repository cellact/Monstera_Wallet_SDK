/**
 * Encoder for the {@code PasswordMinuteSignatureAuthenticator} KeyVault {@code authProof}.
 *
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofEncoder} KeyVaultAuthProofEncoder
 *
 * @module internal/auth/proof/encoders/passwordMinuteSignature
 */

import { createAuthProofMinuteSignature } from '../../../crypto/index.js';
import { createActionBoundProofEncoder } from '../createActionBoundProofEncoder.js';

/** @type {KeyVaultAuthProofEncoder} */
export const passwordMinuteSignatureKeyVaultAuthProofEncoder = createActionBoundProofEncoder({
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
