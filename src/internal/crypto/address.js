/**
 * Address normalisation helpers shared across auth / vault internals.
 *
 * @module internal/crypto/address
 */

import { getAddress } from '../../adapters/ethers/addresses.js';
import { requireAddress } from '../validation/assert.js';

/**
 * Validate and EIP-55 checksum an EVM address (same semantics as {@code ethers.getAddress}).
 *
 * @public
 * @param {Address} address - EVM address (any case)
 * @returns {Address} Checksum-cased address
 * @throws {ValidationError} If {@code address} fails validation (raised by {@link requireAddress})
 */
export function toChecksumAddress(address) {
  requireAddress(address, 'address');
  return getAddress(address);
}
