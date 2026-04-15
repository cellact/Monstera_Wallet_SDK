/**
 * Registry: built-in authenticator address → create-wallet auth encoder (strategy).
 *
 * @typedef {import('../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {{ id: string, encode: (authConfig: Record<string, unknown>) => import('../../types/index.js').Bytes }} CreateWalletAuthEncoder
 */

import { tryChecksumAddress } from './addresses.js';
import { passwordAuthCreateWalletEncoder } from './encoders/password.js';
import { walletSignatureAuthCreateWalletEncoder } from './encoders/walletSignature.js';
import { dualFactorAuthCreateWalletEncoder } from './encoders/dualFactor.js';
import { passwordMinuteSignatureAuthCreateWalletEncoder } from './encoders/passwordMinuteSignature.js';

/**
 * @param {ContractAddresses} addresses
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: string) => CreateWalletAuthEncoder | undefined }}
 */
export function createCreateWalletAuthEncoderRegistry(addresses) {
  /** @type {Map<string, CreateWalletAuthEncoder>} */
  const byChecksum = new Map();

  const register = (addr, encoder) => {
    const key = tryChecksumAddress(addr);
    if (key) {
      byChecksum.set(key, encoder);
    }
  };

  register(addresses.passwordAuth, passwordAuthCreateWalletEncoder);
  register(addresses.walletSignatureAuth, walletSignatureAuthCreateWalletEncoder);
  register(addresses.dualFactorAuth, dualFactorAuthCreateWalletEncoder);
  register(addresses.passwordMinuteSignatureAuth, passwordMinuteSignatureAuthCreateWalletEncoder);

  return {
    /**
     * @param {string} authenticatorAddr
     * @returns {CreateWalletAuthEncoder | undefined}
     */
    getByAuthenticatorAddr(authenticatorAddr) {
      const key = tryChecksumAddress(authenticatorAddr);
      if (!key) {
        return undefined;
      }
      return byChecksum.get(key);
    }
  };
}
