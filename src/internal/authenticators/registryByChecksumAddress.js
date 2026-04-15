/**
 * Shared factory: checksum-normalized authenticator contract address → encoder.
 */

import { tryChecksumAddress } from '../evm/addresses.js';

/**
 * @template T
 * @param {Array<{ address: string, encoder: T }>} entries
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: string) => T | undefined }}
 */
export function createRegistryByChecksumAddress(entries) {
  /** @type {Map<string, T>} */
  const byChecksum = new Map();

  for (const { address, encoder } of entries) {
    const key = tryChecksumAddress(address);
    if (key) {
      byChecksum.set(key, encoder);
    }
  }

  return {
    /**
     * @param {string} authenticatorAddr
     * @returns {T | undefined}
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
