/**
 * Primitive value validators (strings, numbers, objects, booleans).
 *
 * @module internal/validation/primitives
 */

import { ValidationError } from '../../errors/index.js';
import { HDNodeWallet, Wallet } from '../../adapters/ethers/index.js';
import { Mnemonic } from '../../adapters/ethers/index.js';
import { normalizeBigInt, normalizeChainId, normalizeMnemonic, normalizeUsername } from '../utils/normalize.js';
import { nowUnixTimestampSeconds } from '../utils/time.js';

/**
 * @param {string} value
 * @param {string} [name]
 */
export function requireString(value, name = 'string') {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${name} is required and must be a non-empty string`, name, value);
  }
}

/**
 * @param {unknown} value
 * @param {string} [name]
 * @returns {string}
 */
export function requireNormalizedUsername(value, name = 'username') {
  const normalized = normalizeUsername(value);
  if (normalized === undefined) {
    throw new ValidationError(`${name} is required and must be a non-empty string`, name, value);
  }
  return normalized;
}

/**
 * @param {Mnemonic} value
 * @param {string} [name]
 */
export function requireMnemonic(value, name = 'mnemonic') {
  requireString(value, name);

  const normalized = normalizeMnemonic(value);
  if (!normalized) {
    throw new ValidationError(`${name} is required and must be a non-empty string`, name, value);
  }

  const words = normalized.split(' ').filter(word => word.length > 0);

  if (words.length !== 12 && words.length !== 24) {
    throw new ValidationError(
      `${name} must be a valid BIP39 mnemonic with 12 or 24 words (got ${words.length} words)`,
      name,
      value
    );
  }

  if (!Mnemonic.isValidMnemonic(normalized)) {
    throw new ValidationError(
      `${name} is not a valid BIP39 mnemonic (invalid words, length, or checksum)`,
      name,
      value
    );
  }
}

/**
 * @param {number | bigint} value
 * @param {string} [name]
 * @param {{ allowZero?: boolean, allowNegative?: boolean, requireInteger?: boolean }} [options]
 */
export function requireNumber(value, name = 'number', options = {}) {
  const { allowZero = true, allowNegative = false, requireInteger = false } = options;

  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required`, name, value);
  }

  const isNumber = typeof value === 'number';
  const isBigInt = typeof value === 'bigint';

  if (!isNumber && !isBigInt) {
    throw new ValidationError(`${name} is required and must be a number or BigInt`, name, value);
  }

  const numValue = isBigInt ? Number(value) : value;

  if (!allowZero && numValue === 0) {
    throw new ValidationError(`${name} must be non-zero`, name, value);
  }

  if (!allowNegative && numValue < 0) {
    throw new ValidationError(`${name} must be non-negative`, name, value);
  }

  if (requireInteger) {
    if (isBigInt) {
      return;
    }
    if (!Number.isInteger(numValue)) {
      throw new ValidationError(`${name} must be an integer`, name, value);
    }
  }
}

/**
 * @param {number | bigint} value
 * @param {string} [name]
 */
export function requireNonNegativeInteger(value, name = 'number') {
  requireNumber(value, name, { allowZero: true, allowNegative: false, requireInteger: true });
}

/**
 * @param {number | bigint} value
 * @param {string} [name]
 */
export function requirePositiveInteger(value, name = 'number') {
  requireNumber(value, name, { allowZero: false, allowNegative: false, requireInteger: true });
}

/**
 * @param {Array} value
 * @param {string} [name]
 */
export function requireArray(value, name = 'array') {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${name} is required and must be an array`, name, value);
  }
  if (value.length === 0) {
    throw new ValidationError(`${name} must be a non-empty array`, name, value);
  }
}

/**
 * @param {Wallet | HDNodeWallet} value
 * @param {string} [name]
 */
export function requireWalletOrHdNode(value, name = 'signer') {
  if (!value || !(value instanceof Wallet || value instanceof HDNodeWallet)) {
    throw new ValidationError(`${name} is required and must be a Wallet or HDNodeWallet`, name, value);
  }
}

/**
 * @param {string | number} value
 * @param {string} [name]
 */
export function requireStringOrNumber(value, name = 'string or number') {
  if (!value || typeof value !== 'string' && typeof value !== 'number') {
    throw new ValidationError(`${name} is required and must be a string or number`, name, value);
  }
}

/**
 * @param {unknown} value
 * @param {string} [name]
 * @returns {ChainId}
 */
export function requireChainId(value, name = 'chainId') {
  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required and must be a chain id`, name, value);
  }
  const normalized = normalizeChainId(value);
  if (normalized === undefined) {
    throw new ValidationError(
      `${name} must be a finite chain id (number, bigint, decimal string, or hex string)`,
      name,
      value
    );
  }
  return normalized;
}

/**
 * @param {unknown} value
 * @param {string} [name]
 * @param {{ allowNegative?: boolean }} [options]
 * @returns {bigint}
 */
export function requireBigInt(value, name = 'value', options = {}) {
  const { allowNegative = true } = options;

  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required and must be a bigint`, name, value);
  }

  const b = normalizeBigInt(value);
  if (b === undefined) {
    throw new ValidationError(
      `${name} must be a bigint, finite integer number, or decimal/hex string`,
      name,
      value
    );
  }

  if (!allowNegative && b < 0n) {
    throw new ValidationError(`${name} must be non-negative`, name, value);
  }

  return b;
}

/**
 * @param {number} value
 * @param {string} [name]
 */
export function isInFuture(value, name = 'date') {
  const nowInSeconds = nowUnixTimestampSeconds();
  if (value < nowInSeconds) {
    throw new ValidationError(`${name} must be in the future`, name, value);
  }
}

/**
 * @param {boolean} value
 * @param {string} [name]
 */
export function requireBoolean(value, name = 'boolean') {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${name} is required and must be a boolean`, name, value);
  }
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @param {string} [name]
 */
export function requireDefined(value, name = 'value') {
  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required`, name, value);
  }
}

/**
 * @param {unknown} value
 * @param {string} [name]
 * @param {{ requireNonEmpty?: boolean, message?: string }} [options]
 */
export function requirePlainObject(value, name = 'object', options = {}) {
  const { requireNonEmpty = false, message } = options;

  if (!isPlainObject(value)) {
    throw new ValidationError(
      message ?? `${name} is required and must be a plain object`,
      name,
      value
    );
  }

  if (requireNonEmpty && Object.keys(value).length === 0) {
    throw new ValidationError(`${name} must be a non-empty plain object`, name, value);
  }
}

/**
 * @param {unknown} value
 * @param {string} [name]
 */
export function requireNonEmptyObject(value, name = 'object') {
  requirePlainObject(value, name, { requireNonEmpty: true });
}
