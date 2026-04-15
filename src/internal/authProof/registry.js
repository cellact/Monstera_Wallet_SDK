/**
 * Registry: built-in KeyVault authenticator address → async authProof encoder (strategy).
 *
 * @typedef {import('../../types/index.js').ContractAddresses} ContractAddresses
 */

import { tryChecksumAddress } from '../authConfig/addresses.js';
import { passwordKeyVaultAuthProofEncoder } from './encoders/password.js';
import { walletSignatureKeyVaultAuthProofEncoder } from './encoders/walletSignature.js';
import { dualFactorKeyVaultAuthProofEncoder } from './encoders/dualFactor.js';
import { passwordMinuteSignatureKeyVaultAuthProofEncoder } from './encoders/passwordMinuteSignature.js';

/**
 * @param {ContractAddresses} addresses
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: string) => { id: string, encode: Function } | undefined }}
 */
export function createKeyVaultAuthProofEncoderRegistry(addresses) {
  /** @type {Map<string, { id: string, encode: Function }>} */
  const byChecksum = new Map();

  const register = (addr, encoder) => {
    const key = tryChecksumAddress(addr);
    if (key) {
      byChecksum.set(key, encoder);
    }
  };

  register(addresses.passwordAuth, passwordKeyVaultAuthProofEncoder);
  register(addresses.walletSignatureAuth, walletSignatureKeyVaultAuthProofEncoder);
  register(addresses.dualFactorAuth, dualFactorKeyVaultAuthProofEncoder);
  register(addresses.passwordMinuteSignatureAuth, passwordMinuteSignatureKeyVaultAuthProofEncoder);

  return {
    /**
     * @param {string} authenticatorAddr
     * @returns {{ id: string, encode: Function } | undefined}
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
