/**
 * Registry: built-in authenticator address → create-wallet auth encoder (strategy).
 *
 * @typedef {import('../../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {{ id: string, encode: (authConfig: import('../../../types/index.js').CreateWalletStructuredAuthConfig) => import('../../../types/index.js').Bytes | import('../../../types/index.js').Bytes32 }} CreateWalletAuthEncoder
 */

import { createRegistryByChecksumAddress } from '../registryByChecksumAddress.js';
import { passwordAuthCreateWalletEncoder } from './encoders/password.js';
import { walletSignatureAuthCreateWalletEncoder } from './encoders/walletSignature.js';
import { dualFactorAuthCreateWalletEncoder } from './encoders/dualFactor.js';
import { passwordMinuteSignatureAuthCreateWalletEncoder } from './encoders/passwordMinuteSignature.js';

/**
 * @param {ContractAddresses} addresses
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: Address) => CreateWalletAuthEncoder | undefined }}
 */
export function createCreateWalletAuthEncoderRegistry(addresses) {
  return createRegistryByChecksumAddress([
    { address: addresses.passwordAuth, encoder: passwordAuthCreateWalletEncoder },
    { address: addresses.walletSignatureAuth, encoder: walletSignatureAuthCreateWalletEncoder },
    { address: addresses.dualFactorAuth, encoder: dualFactorAuthCreateWalletEncoder },
    { address: addresses.passwordMinuteSignatureAuth, encoder: passwordMinuteSignatureAuthCreateWalletEncoder }
  ]);
}
