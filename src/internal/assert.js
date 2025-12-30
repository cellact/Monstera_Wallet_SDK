/**
 * Validation utilities
 * 
 * Pure validation functions that can be used anywhere in the SDK.
 * These throw errors on validation failure.
 */

const { ValidationError } = require('../errors');

/**
 * Check if a value is a valid Ethereum address
 * 
 * @param {String} value - Value to check
 * @returns {Boolean} True if valid address
 */
function isAddress(value) {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * Require an address value
 * 
 * @param {String} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @throws {Error} If value is not provided or is not a valid address string
 */
function requireAddress(value, name = 'address') {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${name} is required and must be a string`, name, value);
  }
  if (!isAddress(value)) {
    throw new ValidationError(`${name} must be a valid Ethereum address`, name, value);
  }
}

/**
 * Require a bytes value
 * 
 * @param {String|Uint8Array} value - Value to validate
 * @param {String} name - Parameter name for error message
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
 * Require a string value
 * 
 * @param {String} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @throws {Error} If value is not provided or is not a valid string
 */
function requireString(value, name = 'string') {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${name} is required and must be a string`, name, value);
  }
}

/**
 * Require a number value (supports both Number and BigInt)
 * 
 * @param {Number|BigInt} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @param {Object} options - Validation options
 * @param {Boolean} [options.allowZero=true] - Allow zero
 * @param {Boolean} [options.allowNegative=false] - Allow negative numbers
 * @param {Boolean} [options.requireInteger=false] - Require integer
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
 * @param {Number|BigInt} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @throws {Error} If value is not a non-negative integer
 */
function requireNonNegativeInteger(value, name = 'number') {
  requireNumber(value, name, { allowZero: true, allowNegative: false, requireInteger: true });
}

/**
 * Require a positive integer (supports both Number and BigInt)
 * 
 * @param {Number|BigInt} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @throws {Error} If value is not a positive integer
 */
function requirePositiveInteger(value, name = 'number') {
  requireNumber(value, name, { allowZero: false, allowNegative: false, requireInteger: true });
}

module.exports = {
  isAddress,
  requireAddress,
  requireBytes,
  requireString,
  requireNumber,
  requireNonNegativeInteger,
  requirePositiveInteger
};
