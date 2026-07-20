/**
 * Shared factory used by both the create-wallet ({@code authConfig}) and authenticated-call
 * ({@code authProof}) registries.
 *
 * @description Normalises every input address to its EIP-55 checksum form via
 * {@link toChecksumAddress} before storing or looking up entries, so callers can pass any case
 * variation and still get a hit.
 *
 * @module internal/auth/registry/byChecksumAddress
 */

import { toChecksumAddress } from '../../crypto/address.js';

/**
 * Build a checksum-keyed encoder registry.
 *
 * @template T
 * @param {Array<{ address: Address, encoder: T }>} entries - Address / encoder pairs to register
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: Address) => T | undefined }}
 */
export function createRegistryByChecksumAddress(entries) {
  /** @type {Map<string, T>} */
  const byChecksum = new Map();

  for (const { address, encoder } of entries) {
    const key = toChecksumAddress(address);
    byChecksum.set(key, encoder);
  }

  return {
    getByAuthenticatorAddr(authenticatorAddr) {
      const key = toChecksumAddress(authenticatorAddr);
      return byChecksum.get(key);
    }
  };
}
