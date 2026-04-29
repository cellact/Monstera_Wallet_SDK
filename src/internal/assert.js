/**
 * Validation utilities
 * 
 * Pure validation functions that can be used anywhere in the SDK.
 * These throw errors on validation failure.
 * 
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').Mnemonic} Mnemonic
 */

import { ValidationError } from '../errors/index.js';
import { Mnemonic, ethers, HDNodeWallet, Wallet } from 'ethers';
import { normalizeChainId } from './utils/normalize.js';
import { nowUnixTimestampSeconds } from './utils/time.js';

/**
 * Check if a value is a valid Ethereum address
 * 
 * @param {string} value - Value to check
 * @returns {boolean} True if valid address
 */
function isAddress(value) {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * Require an address value
 * 
 * @param {string} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not provided or is not a valid address string
 */
function requireAddress(value, name = 'address') {
  requireString(value, name);
  if (!isAddress(value)) {
    throw new ValidationError(`${name} must be a valid Ethereum address`, name, value);
  }
}

/**
 * Require a bytes value
 * 
 * @param {string|Uint8Array} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not provided or is not a valid bytes string or Uint8Array
 */
function requireBytes(value, name = 'bytes') {
  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required`, name, value);
  }
  
  // Uint8Array is always valid bytes
  if (value instanceof Uint8Array) {
    return;
  }
  
  // String must be valid hex
  if (typeof value === 'string') {
    // Check if it's a valid hex string
    if (!/^0x[a-fA-F0-9]*$/.test(value)) {
      throw new ValidationError(`${name} must be a valid hex string (0x...) or Uint8Array`, name, value);
    }
    // Optional: validate even length (hex pairs)
    // if (value.length > 2 && (value.length - 2) % 2 !== 0) {
    //   throw new ValidationError(`${name} hex string must have even length (pairs of hex digits)`, name, value);
    // }
    return;
  }
  
  throw new ValidationError(`${name} must be a string (hex) or Uint8Array`, name, value);
}

/**
 * Require a 32-byte hex string value
 * 
 * @param {string} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not provided or is not a valid 32-byte hex string
 */
function requireBytes32(value, name = 'bytes32') {
  requireString(value, name);
  if (!ethers.isHexString(value, 32)) {
    throw new ValidationError(`${name} must be a 32-byte hex string value`, name, value);
  }
}

/**
 * Require a Uint8Array value
 * 
 * @param {Uint8Array} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not provided or is not a non-empty Uint8Array
 */
function requireUtf8Bytes(value, name = 'utf8Bytes') {
  if (!(value instanceof Uint8Array)) {
    throw new ValidationError(`${name} is required and must be a Uint8Array`, name, value);
  }
  if (value.length === 0) {
    throw new ValidationError(`${name} must be a non-empty Uint8Array`, name, value);
  }
}

/**
 * Require a string value
 * 
 * @param {string} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not provided or is not a valid string
 */
function requireString(value, name = 'string') {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${name} is required and must be a string`, name, value);
  }
}

/**
 * Require a valid BIP39 mnemonic phrase (12 or 24 words)
 * 
 * @param {Mnemonic} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not a valid BIP39 mnemonic
 */
function requireMnemonic(value, name = 'mnemonic') {
  requireString(value, name);
  
  // Normalize the mnemonic more aggressively to handle ethers v6 whitespace issues
  // Remove all types of whitespace (spaces, tabs, newlines) and replace with single space
  const normalized = value
    .trim()
    .replace(/[\s\n\r\t]+/g, ' ')  // Replace all whitespace types with single space
    .replace(/\s+/g, ' ')           // Ensure no double spaces
    .trim();

  const words = normalized.split(' ').filter(word => word.length > 0);
  
  // Check word count (must be 12 or 24 words)
  if (words.length !== 12 && words.length !== 24) {
    throw new ValidationError(
      `${name} must be a valid BIP39 mnemonic with 12 or 24 words (got ${words.length} words)`,
      name,
      value
    );
  }

  // Use ethers v6 official validation method
  // Mnemonic.isValidMnemonic() checks: wordlist membership, valid length, and checksum
  if (!Mnemonic.isValidMnemonic(normalized)) {
    throw new ValidationError(
      `${name} is not a valid BIP39 mnemonic (invalid words, length, or checksum)`,
      name,
      value
    );
  }
}

/**
 * Require a number value (supports both Number and BigInt)
 * 
 * @param {number|BigInt} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @param {Record<string, unknown>} options - Validation options
 * @param {boolean} [options.allowZero=true] - Allow zero
 * @param {boolean} [options.allowNegative=false] - Allow negative numbers
 * @param {boolean} [options.requireInteger=false] - Require integer
 * @throws {Error} If value is not a valid number or BigInt or is not provided
 */
function requireNumber(value, name = 'number', options = {}) {
  const { allowZero = true, allowNegative = false, requireInteger = false } = options;

  // Accept both number and BigInt
  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required`, name, value);
  }
  
  const isNumber = typeof value === 'number';
  const isBigInt = typeof value === 'bigint';
  
  if (!isNumber && !isBigInt) {
    throw new ValidationError(`${name} is required and must be a number or BigInt`, name, value);
  }

  // Convert BigInt to Number for comparisons (safe for reasonable ranges)
  // Note: This conversion is safe for gas values, nonces, etc. but may lose precision
  // for very large BigInt values (> Number.MAX_SAFE_INTEGER)
  const numValue = isBigInt ? Number(value) : value;

  if (!allowZero && numValue === 0) {
    throw new ValidationError(`${name} must be non-zero`, name, value);
  }

  if (!allowNegative && numValue < 0) {
    throw new ValidationError(`${name} must be non-negative`, name, value);
  }

  if (requireInteger) {
    if (isBigInt) {
      // BigInt is always an integer, so validation passes
      return;
    }
    if (!Number.isInteger(numValue)) {
      throw new ValidationError(`${name} must be an integer`, name, value);
    }
  }
}

/**
 * Require a non-negative integer (supports both Number and BigInt)
 * 
 * @param {number|BigInt} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not a non-negative integer
 */
function requireNonNegativeInteger(value, name = 'number') {
  requireNumber(value, name, { allowZero: true, allowNegative: false, requireInteger: true });
}

/**
 * Require a positive integer (supports both Number and BigInt)
 * 
 * @param {number|BigInt} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not a positive integer
 */
function requirePositiveInteger(value, name = 'number') {
  requireNumber(value, name, { allowZero: false, allowNegative: false, requireInteger: true });
}

/**
 * Require an array value
 * 
 * @param {Array} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not an array or is empty
 */
function requireArray(value, name = 'array') {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${name} is required and must be an array`, name, value);
  }
  if (value.length === 0) {
    throw new ValidationError(`${name} must be a non-empty array`, name, value);
  }
}

/**
 * Require a Wallet or HDNodeWallet value
 * 
 * @param {Wallet | HDNodeWallet} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not a Wallet or HDNodeWallet
 */
function requireWalletOrHdNode(value, name = 'signer') {
  if (!value || !(value instanceof Wallet || value instanceof HDNodeWallet)) {
    throw new ValidationError(`${name} is required and must be a Wallet or HDNodeWallet`, name, value);
  }
}

/**
 * Require a string or number value
 * 
 * @param {string|number} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not a string or number
 */
function requireStringOrNumber(value, name = 'string or number') {
  if (!value || typeof value !== 'string' && typeof value !== 'number') {
    throw new ValidationError(`${name} is required and must be a string or number`, name, value);
  }
}

/**
 * Require a parsable EVM chain id (number, bigint, decimal string, or {@code 0x} hex string).
 *
 * @param {unknown} value
 * @param {string} [name='chainId']
 * @returns {import('../types/index.js').ChainId}
 * @throws {ValidationError} If missing or not parseable to a finite chain id
 */
function requireChainId(value, name = 'chainId') {
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
 * Check if a value is in the future
 * 
 * @param {number} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not in the future
 */
function isInFuture(value, name = 'date') {
  const nowInSeconds = nowUnixTimestampSeconds();
  if (value < nowInSeconds) {
    throw new ValidationError(`${name} must be in the future`, name, value);
  }
}

/**
 * Require a boolean value
 * 
 * @param {boolean} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not a boolean
 */
function requireBoolean(value, name = 'boolean') {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${name} is required and must be a boolean`, name, value);
  }
}

/**
 * Require an object value
 * 
 * @param {object} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @throws {Error} If value is not an object or is empty
 */
function requireObject(value, name = 'object') {
  if (!value || typeof value !== 'object') {
    throw new ValidationError(`${name} is required and must be an object`, name, value);
  }
}


export {
  isAddress,
  requireAddress,
  requireBytes,
  requireString,
  requireMnemonic,
  requireNumber,
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireArray, 
  requireBytes32,
  requireWalletOrHdNode, 
  requireStringOrNumber,
  requireChainId,
  isInFuture,
  requireBoolean,
  requireUtf8Bytes,
  requireObject
};
