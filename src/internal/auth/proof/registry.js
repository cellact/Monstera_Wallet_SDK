/**
 * Address → authProof encoder lookup used by {@link AuthProofBuilder}.
 *
 * Wires the four built-in KeyVault authProof encoders (password, walletSignature, dualFactor,
 * passwordMinuteSignature) into a checksum-keyed registry. Returns {@code undefined} for unknown
 * authenticators so the builder can reject the call with a descriptive error.
 *
 * @typedef {import('../../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../../../types/index.js').AuthProofEncoderRegistry} AuthProofEncoderRegistry
 *
 * @module internal/auth/proof/registry
 */

import { createRegistryByChecksumAddress } from '../registryByChecksumAddress.js';
import { passwordKeyVaultAuthProofEncoder } from './encoders/password.js';
import { walletSignatureKeyVaultAuthProofEncoder } from './encoders/walletSignature.js';
import { dualFactorKeyVaultAuthProofEncoder } from './encoders/dualFactor.js';
import { passwordMinuteSignatureKeyVaultAuthProofEncoder } from './encoders/passwordMinuteSignature.js';

/**
 * Build the address-keyed encoder registry for KeyVault authProofs.
 *
 * @public
 * @param {ContractAddresses} addresses - Resolved network addresses
 * @returns {AuthProofEncoderRegistry} Registry exposing {@code getByAuthenticatorAddr}
 * @throws {ValidationError} If an address in {@code addresses} fails checksum validation
 *   (raised by {@link createRegistryByChecksumAddress})
 */
export function createAuthProofEncoderRegistry(addresses) {
  return createRegistryByChecksumAddress([
    { address: addresses.passwordAuth, encoder: passwordKeyVaultAuthProofEncoder },
    { address: addresses.walletSignatureAuth, encoder: walletSignatureKeyVaultAuthProofEncoder },
    { address: addresses.dualFactorAuth, encoder: dualFactorKeyVaultAuthProofEncoder },
    { address: addresses.passwordMinuteSignatureAuth, encoder: passwordMinuteSignatureKeyVaultAuthProofEncoder }
  ]);
}
