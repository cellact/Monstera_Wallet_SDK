/**
 * Address → encoder lookup used by {@link EncodeAuthConfig}.
 *
 * Wires the four built-in create-wallet authConfig encoders (password, walletSignature,
 * dualFactor, passwordMinuteSignature) into a single
 * {@link createRegistryByChecksumAddress}-based registry keyed by the network's authenticator
 * addresses. Returns {@code undefined} for unknown addresses so the builder can fall back to its
 * "advanced consumer" hex-string path.
 *
 * @typedef {import('../../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').CreateWalletAuthEncoder} CreateWalletAuthEncoder
 *
 * @module internal/auth/config/registry
 */

import { createRegistryByChecksumAddress } from '../shared/registryByChecksumAddress.js';
import { passwordAuthCreateWalletEncoder } from '../encoders/passwordAuthenticator.js';
import { walletSignatureAuthCreateWalletEncoder } from '../encoders/walletSignatureAuthenticator.js';
import { dualFactorAuthCreateWalletEncoder } from '../encoders/dualFactorAuthenticator.js';
import { passwordMinuteSignatureAuthCreateWalletEncoder } from '../encoders/passwordMinuteSignatureAuthenticator.js';

/**
 * Build the address-keyed encoder registry for create-wallet auth configs.
 *
 * @public
 * @param {ContractAddresses} addresses - Resolved network addresses (per
 *   {@link MonsteraConfig.resolveBaseConfig})
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: Address) => CreateWalletAuthEncoder | undefined }}
 *   Registry exposing a single {@code getByAuthenticatorAddr} lookup
 * @throws {ValidationError} If an address in {@code addresses} fails checksum validation
 *   (raised by {@link createRegistryByChecksumAddress})
 */
export function createCreateWalletAuthEncoderRegistry(addresses) {
  return createRegistryByChecksumAddress([
    { address: addresses.passwordAuth, encoder: passwordAuthCreateWalletEncoder },
    { address: addresses.walletSignatureAuth, encoder: walletSignatureAuthCreateWalletEncoder },
    { address: addresses.dualFactorAuth, encoder: dualFactorAuthCreateWalletEncoder },
    { address: addresses.passwordMinuteSignatureAuth, encoder: passwordMinuteSignatureAuthCreateWalletEncoder }
  ]);
}
