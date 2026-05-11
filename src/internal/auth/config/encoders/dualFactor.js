/**
 * Encoder for the {@code DualFactorAuthenticator} create-wallet auth config.
 *
 * Defers to {@link createDualFactorAuthConfig} which ABI-encodes
 * {@code (bytes32 passwordHash, address guardian)}.
 *
 * @typedef {import('../../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../../types/index.js').Address} Address
 * @typedef {import('../../../../types/index.js').DualFactorAuthConfigInputOptions} DualFactorAuthConfigInputOptions
 * @typedef {import('../../../../types/index.js').EncodedAuthConfigDualFactor} EncodedAuthConfigDualFactor
 *
 * @module internal/auth/config/encoders/dualFactor
 */

import { createDualFactorAuthConfig } from '../../../crypto/index.js';

/**
 * Strategy registered against the DualFactorAuthenticator address.
 *
 * @public
 * @readonly
 * @type {{ id: string, encode: (authConfig: DualFactorAuthConfigInputOptions) => EncodedAuthConfigDualFactor }}
 */
export const dualFactorAuthCreateWalletEncoder = {
  id: 'dualFactorAuth',

  /**
   * Encode {@code (passwordHash, guardianAddr)} into the contract-expected bytes layout.
   *
   * @public
   * @param {DualFactorAuthConfigInputOptions} authConfig - Structured input
   *   ({@code { passwordHash, guardianAddr }})
   * @returns {EncodedAuthConfigDualFactor} ABI-encoded bytes
   * @throws {ValidationError} If {@code passwordHash} is not a 32-byte hex string or
   *   {@code guardianAddr} fails address validation (raised by {@link createDualFactorAuthConfig})
   */
  encode(authConfig) {
    const { passwordHash, guardianAddr } = authConfig;
    return createDualFactorAuthConfig(
      /** @type {Bytes32} */ (passwordHash),
      /** @type {Address} */ (guardianAddr)
    );
  }
};
