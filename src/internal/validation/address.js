/**
 * EVM address validators.
 *
 * @module internal/validation/address
 */

import { ValidationError } from '../../errors/index.js';
import { isAddress as ethersIsAddress } from '../../adapters/ethers/addresses.js';
import { requireString } from './primitives.js';

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isAddress(value) {
  return typeof value === 'string' && ethersIsAddress(value);
}

/**
 * @param {string} value
 * @param {string} [name]
 */
export function requireAddress(value, name = 'address') {
  requireString(value, name);
  if (!isAddress(value)) {
    throw new ValidationError(`${name} must be a valid Ethereum address`, name, value);
  }
}
