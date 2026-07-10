/**
 * Shared factory used by both the create-wallet ({@code authConfig}) and authenticated-call
 * ({@code authProof}) registries.
 *
 * @description Normalises every input address to its EIP-55 checksum form via
 * {@link toChecksumAddress} before storing or looking up entries, so callers can pass any case
 * variation and still get a hit.
 *
 * @module internal/auth/shared/registryByChecksumAddress
 */

import { toChecksumAddress } from '../../vault/authorization.js';

/**
 * Build a checksum-keyed encoder registry.
 *
 * @description Returns an object exposing a single {@code getByAuthenticatorAddr} method that
 * returns the registered encoder (or {@code undefined}) for a given authenticator address.
 *
 * @public
 * @template T
 * @param {Array<{ address: Address, encoder: T }>} entries - Address / encoder pairs to register
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: Address) => T | undefined }} Registry
 * @throws {ValidationError} If any input address fails {@link toChecksumAddress} validation
 */
export function createRegistryByChecksumAddress(entries) {
  /** @type {Map<string, T>} */
  const byChecksum = new Map();

  for (const { address, encoder } of entries) {
    const key = toChecksumAddress(address);
    byChecksum.set(key, encoder);
  }

  return {
    /**
     * Look up the encoder registered for a given authenticator address.
     *
     * @public
     * @param {Address} authenticatorAddr - Authenticator contract address
     * @returns {T | undefined} Registered encoder, or {@code undefined} if unknown
     * @throws {ValidationError} If {@code authenticatorAddr} fails checksum validation
     */
    getByAuthenticatorAddr(authenticatorAddr) {
      const key = toChecksumAddress(authenticatorAddr);
      return byChecksum.get(key);
    }
  };
}
