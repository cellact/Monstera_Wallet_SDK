/**
 * Registry: built-in KeyVault authenticator address → async authProof encoder (strategy).
 *
 * @typedef {import('../../../types/index.js').ContractAddresses} ContractAddresses
 */

import { createRegistryByChecksumAddress } from '../registryByChecksumAddress.js';
import { passwordKeyVaultAuthProofEncoder } from './encoders/password.js';
import { walletSignatureKeyVaultAuthProofEncoder } from './encoders/walletSignature.js';
import { dualFactorKeyVaultAuthProofEncoder } from './encoders/dualFactor.js';
import { passwordMinuteSignatureKeyVaultAuthProofEncoder } from './encoders/passwordMinuteSignature.js';

/**
 * @param {ContractAddresses} addresses
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: string) => { id: string, encode: Function } | undefined }}
 */
export function createKeyVaultAuthProofEncoderRegistry(addresses) {
  return createRegistryByChecksumAddress([
    { address: addresses.passwordAuth, encoder: passwordKeyVaultAuthProofEncoder },
    { address: addresses.walletSignatureAuth, encoder: walletSignatureKeyVaultAuthProofEncoder },
    { address: addresses.dualFactorAuth, encoder: dualFactorKeyVaultAuthProofEncoder },
    { address: addresses.passwordMinuteSignatureAuth, encoder: passwordMinuteSignatureKeyVaultAuthProofEncoder }
  ]);
}
