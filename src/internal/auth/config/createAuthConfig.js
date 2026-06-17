/**
 * ABI-encoded {@code authConfig} byte builders for {@code WalletFactory.createWallet*} entry points.
 *
 * Used by per-authenticator encoders in {@code internal/auth/encoders}.
 *
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../types/index.js').WalletSignatureAuthConfigInputOptions} WalletSignatureAuthConfigInputOptions
 * @typedef {import('../../../types/index.js').EncodedAuthConfigWalletSignature} EncodedAuthConfigWalletSignature
 * @typedef {import('../../../types/index.js').EncodedAuthConfigDualFactor} EncodedAuthConfigDualFactor
 * @typedef {import('../../../types/index.js').DualFactorAuthConfigInputOptions} DualFactorAuthConfigInputOptions
 *
 * @module internal/auth/config/createAuthConfig
 */

import { defaultAbiCoder } from '../../../adapters/ethers/encoding.js';
import { requireAddress, requireArray, requireBytes32 } from '../../assert.js';

/**
 * Build the {@code WalletSignatureAuthenticator} create-wallet config bytes.
 *
 * @public
 * @param {WalletSignatureAuthConfigInputOptions['initialWhitelist'] | Address[]} whitelist
 * @returns {EncodedAuthConfigWalletSignature}
 */
function createWalletSigAuthConfig(whitelist) {
  requireArray(whitelist, 'whitelist');
  for (const address of whitelist) {
    requireAddress(address, 'address');
  }
  return defaultAbiCoder.encode(['address[]'], [whitelist]);
}

/**
 * Build the {@code DualFactorAuthenticator} create-wallet config bytes.
 *
 * @public
 * @param {Bytes32} passwordHash
 * @param {Address} guardianAddr
 * @returns {EncodedAuthConfigDualFactor}
 */
function createDualFactorAuthConfig(passwordHash, guardianAddr) {
  requireBytes32(passwordHash, 'passwordHash');
  requireAddress(guardianAddr, 'guardianAddr');

  return defaultAbiCoder.encode(['bytes32', 'address'], [passwordHash, guardianAddr]);
}

export { createWalletSigAuthConfig, createDualFactorAuthConfig };
