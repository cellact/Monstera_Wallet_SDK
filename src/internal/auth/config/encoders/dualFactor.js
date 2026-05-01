/**
 * DualFactorAuthenticator — create-wallet {@code authConfig} (ABI-encoded hash + guardian).
 *
 * @typedef {import('../../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../../types/index.js').Address} Address
 * @typedef {import('../../../../types/index.js').DualFactorAuthConfigInputOptions} DualFactorAuthConfigInputOptions
 * @typedef {import('../../../../types/index.js').EncodedAuthConfigDualFactor} EncodedAuthConfigDualFactor
 */

import { createDualFactorAuthConfig } from '../../../crypto/index.js';

/** @type {{ id: string, encode: (authConfig: DualFactorAuthConfigInputOptions) => EncodedAuthConfigDualFactor }} */
export const dualFactorAuthCreateWalletEncoder = {
  id: 'dualFactorAuth',

  /**
   * @param {DualFactorAuthConfigInputOptions} authConfig
   * @returns {EncodedAuthConfigDualFactor}
   */
  encode(authConfig) {
    const { passwordHash, guardianAddr } = authConfig;
    return createDualFactorAuthConfig(
      /** @type {Bytes32} */ (passwordHash),
      /** @type {Address} */ (guardianAddr)
    );
  }
};
