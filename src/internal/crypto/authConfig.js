/**
 * ABI-encoded auth config bytes for wallet factory / configuration flows.
 *
 * @typedef {import('../../types/index.js').WalletSignatureAuthConfigInputOptions} WalletSignatureAuthConfigInputOptions
 * @typedef {import('../../types/index.js').EncodedAuthConfigWalletSignature} EncodedAuthConfigWalletSignature
 * @typedef {import('../../types/index.js').EncodedAuthConfigDualFactor} EncodedAuthConfigDualFactor
 * @typedef {import('../../types/index.js').DualFactorAuthConfigInputOptions} DualFactorAuthConfigInputOptions
 * @typedef {import('../../types/index.js').ValidationError} ValidationError
 */

import { ethers } from 'ethers';
import { requireAddress, requireArray, requireBytes32 } from '../assert.js';

/**
 * Creates a wallet signature auth config from whitelist
 * @param {WalletSignatureAuthConfigInputOptions} whitelist
 * @returns {EncodedAuthConfigWalletSignature} ABI-encoded {@code address[]} auth config (hex)
 * @throws {ValidationError} If whitelist is not an array or contains invalid addresses
 */
function createWalletSigAuthConfig(whitelist) {
  requireArray(whitelist, 'whitelist');
  for (const address of whitelist) {
    requireAddress(address, 'address');
  }
  return ethers.AbiCoder.defaultAbiCoder().encode(['address[]'], [whitelist]);
}

/**
 * Create dual factor auth config
 *
 * @param { DualFactorAuthConfigInputOptions }
 * @returns {EncodedAuthConfigDualFactor} ABI-encoded {@code (bytes32,address)} auth config (hex)
 * @throws {ValidationError} If passwordHash is not a valid 32-byte hex string or guardianAddr is not a valid address
 */
function createDualFactorAuthConfig(passwordHash, guardianAddr) {
  requireBytes32(passwordHash, 'passwordHash');
  requireAddress(guardianAddr, 'guardianAddr');

  return ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'address'], [passwordHash, guardianAddr]);
}

export { createWalletSigAuthConfig, createDualFactorAuthConfig };
