/**
 * Encoder for the {@code DualFactorAuthenticator} KeyVault {@code authProof}.
 *
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofEncoder} KeyVaultAuthProofEncoder
 *
 * @module internal/auth/proof/encoders/dualFactor
 */

import { createAuthProofDualFactor } from '../../../crypto/index.js';
import { createActionBoundProofEncoder } from '../createActionBoundProofEncoder.js';

/** @type {KeyVaultAuthProofEncoder} */
export const dualFactorKeyVaultAuthProofEncoder = createActionBoundProofEncoder({
  id: 'dualFactorAuth',
  withDeadline: true,
  createProof: ({
    readProvider,
    keyVaultAddr,
    passwordHash,
    signer,
    authenticatorAddr,
    deadline,
    chainId,
    actionHash
  }) =>
    createAuthProofDualFactor({
      provider: readProvider,
      keyVaultAddr,
      passwordHash,
      signer,
      authenticatorAddr,
      deadline,
      chainId,
      actionHash
    })
});
