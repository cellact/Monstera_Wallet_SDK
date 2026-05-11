/**
 * ABI-encoded {@code authConfig} byte builders for the {@code WalletFactory.createWallet*}
 * entry points.
 *
 * Used by the per-authenticator create-wallet encoders in {@code internal/auth/config/encoders}.
 *
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../types/index.js').WalletSignatureAuthConfigInputOptions} WalletSignatureAuthConfigInputOptions
 * @typedef {import('../../types/index.js').EncodedAuthConfigWalletSignature} EncodedAuthConfigWalletSignature
 * @typedef {import('../../types/index.js').EncodedAuthConfigDualFactor} EncodedAuthConfigDualFactor
 * @typedef {import('../../types/index.js').DualFactorAuthConfigInputOptions} DualFactorAuthConfigInputOptions
 *
 * @module internal/crypto/authConfig
 */

import { defaultAbiCoder } from '../../adapters/ethers/encoding.js';
import { requireAddress, requireArray, requireBytes32 } from '../assert.js';

/**
 * Build the {@code WalletSignatureAuthenticator} create-wallet config bytes.
 *
 * @description Validates that {@code whitelist} is an array of EVM addresses and ABI-encodes it
 * as {@code address[]}.
 *
 * @public
 * @param {WalletSignatureAuthConfigInputOptions['initialWhitelist'] | Address[]} whitelist -
 *   Initial whitelist of EVM addresses
 * @returns {EncodedAuthConfigWalletSignature} ABI-encoded {@code address[]} auth config (hex)
 * @throws {ValidationError} If {@code whitelist} is not an array (raised by {@link requireArray})
 *   or any entry fails address validation (raised by {@link requireAddress})
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
 * @description Validates the inputs and ABI-encodes them as {@code (bytes32 passwordHash, address guardian)}.
 *
 * @public
 * @param {Bytes32} passwordHash - 32-byte password hash
 * @param {Address} guardianAddr - Guardian EVM address
 * @returns {EncodedAuthConfigDualFactor} ABI-encoded {@code (bytes32,address)} auth config (hex)
 * @throws {ValidationError} If {@code passwordHash} is not a 32-byte hex string (raised by
 *   {@link requireBytes32}) or {@code guardianAddr} fails address validation (raised by
 *   {@link requireAddress})
 */
function createDualFactorAuthConfig(passwordHash, guardianAddr) {
  requireBytes32(passwordHash, 'passwordHash');
  requireAddress(guardianAddr, 'guardianAddr');

  return defaultAbiCoder.encode(['bytes32', 'address'], [passwordHash, guardianAddr]);
}

export { createWalletSigAuthConfig, createDualFactorAuthConfig };
