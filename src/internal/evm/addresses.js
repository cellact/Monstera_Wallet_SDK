/**
 * Checksum helpers for matching authenticator contract addresses.
 *
 * @typedef {import('../../types/index.js').Address} Address
 */

import { ethers } from 'ethers';

/**
 * @param {string} addr
 * @returns {string | null} Checksum address or null if invalid
 */
export function tryChecksumAddress(addr) {
  try {
    return ethers.getAddress(addr);
  } catch {
    return null;
  }
}
