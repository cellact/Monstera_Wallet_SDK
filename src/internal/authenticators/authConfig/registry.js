/**
 * Registry: built-in authenticator address → create-wallet auth encoder (strategy).
 *
 * @typedef {import('../../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {{ id: string, encode: (authConfig: Record<string, unknown>) => import('../../../types/index.js').Bytes }} CreateWalletAuthEncoder
 */

import { createRegistryByChecksumAddress } from '../registryByChecksumAddress.js';
import { passwordAuthCreateWalletEncoder } from './encoders/password.js';
import { walletSignatureAuthCreateWalletEncoder } from './encoders/walletSignature.js';
import { dualFactorAuthCreateWalletEncoder } from './encoders/dualFactor.js';
import { passwordMinuteSignatureAuthCreateWalletEncoder } from './encoders/passwordMinuteSignature.js';

/**
 * @param {ContractAddresses} addresses
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: string) => CreateWalletAuthEncoder | undefined }}
 */
export function createCreateWalletAuthEncoderRegistry(addresses) {
  return createRegistryByChecksumAddress([
    { address: addresses.passwordAuth, encoder: passwordAuthCreateWalletEncoder },
    { address: addresses.walletSignatureAuth, encoder: walletSignatureAuthCreateWalletEncoder },
    { address: addresses.dualFactorAuth, encoder: dualFactorAuthCreateWalletEncoder },
    { address: addresses.passwordMinuteSignatureAuth, encoder: passwordMinuteSignatureAuthCreateWalletEncoder }
  ]);
}
