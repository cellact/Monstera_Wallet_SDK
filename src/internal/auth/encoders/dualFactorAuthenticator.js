/**
 * DualFactorAuthenticator — create-wallet config and KeyVault authProof encoders.
 *
 * @module internal/auth/encoders/dualFactorAuthenticator
 */

import { createAuthProofDualFactor } from '../proof/createAuthProof.js';
import { createDualFactorAuthConfig } from '../config/createAuthConfig.js';
import { bindProofToAction } from '../proof/bindProofToAction.js';

/** @type {import('../../../types/index.js').KeyVaultAuthProofEncoder} */
export const dualFactorKeyVaultAuthProofEncoder = bindProofToAction({
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

/**
 * @public
 * @readonly
 * @type {{ id: string, encode: (authConfig: import('../../../types/index.js').DualFactorAuthConfigInputOptions) => import('../../../types/index.js').EncodedAuthConfigDualFactor }}
 */
export const dualFactorAuthCreateWalletEncoder = {
  id: 'dualFactorAuth',

  encode(authConfig) {
    const { passwordHash, guardianAddr } = authConfig;
    return createDualFactorAuthConfig(
      /** @type {import('../../../types/index.js').Bytes32} */ (passwordHash),
      /** @type {import('../../../types/index.js').Address} */ (guardianAddr)
    );
  }
};
