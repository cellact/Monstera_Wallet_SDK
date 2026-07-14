/**
 * Bytes and hex validators.
 *
 * @module internal/validation/bytes
 */

import { ValidationError } from '../../errors/index.js';
import { isHexString as ethersIsHexString } from '../../adapters/ethers/addresses.js';
import { requireString } from './primitives.js';

/**
 * @param {string | Uint8Array} value
 * @param {string} [name]
 */
export function requireBytes(value, name = 'bytes') {
  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required`, name, value);
  }

  if (value instanceof Uint8Array) {
    return;
  }

  if (typeof value === 'string') {
    if (!/^0x[a-fA-F0-9]*$/.test(value)) {
      throw new ValidationError(`${name} must be a valid hex string (0x...) or Uint8Array`, name, value);
    }
    return;
  }

  throw new ValidationError(`${name} must be a string (hex) or Uint8Array`, name, value);
}

/**
 * @param {string | Uint8Array} value
 * @param {string} [name]
 */
export function requireNonEmptyBytes(value, name = 'bytes') {
  requireBytes(value, name);
  if (value instanceof Uint8Array) {
    if (value.length === 0) {
      throw new ValidationError(`${name} must be non-empty bytes`, name, value);
    }
    return;
  }
  if (typeof value === 'string' && value === '0x') {
    throw new ValidationError(`${name} must be non-empty bytes`, name, value);
  }
}

/**
 * @param {string} value
 * @param {string} [name]
 */
export function requireBytes32(value, name = 'bytes32') {
  requireString(value, name);
  if (!ethersIsHexString(value, 32)) {
    throw new ValidationError(`${name} must be a 32-byte hex string value`, name, value);
  }
}

/**
 * @param {Uint8Array} value
 * @param {string} [name]
 */
export function requireUtf8Bytes(value, name = 'utf8Bytes') {
  if (!(value instanceof Uint8Array)) {
    throw new ValidationError(`${name} is required and must be a Uint8Array`, name, value);
  }
  if (value.length === 0) {
    throw new ValidationError(`${name} must be a non-empty Uint8Array`, name, value);
  }
}

/**
 * @param {string} value
 * @param {string} [name]
 */
export function requireBytes4(value, name = 'bytes4') {
  requireString(value, name);
  if (!ethersIsHexString(value, 4)) {
    throw new ValidationError(`${name} must be a 4-byte hex string`, name, value);
  }
}
