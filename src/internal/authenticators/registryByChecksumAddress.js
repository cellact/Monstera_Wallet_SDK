/**
 * Shared factory: checksum-normalized authenticator contract address → encoder.
 *
 * @typedef {import('../../types/index.js').Address} Address
 */

import { tryChecksumAddress } from '../evm/addresses.js';

/**
 * @template T
 * @param {Array<{ address: Address, encoder: T }>} entries
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: Address) => T | undefined }}
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
     * @param {Address} authenticatorAddr
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
