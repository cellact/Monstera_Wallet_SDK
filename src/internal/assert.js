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
 * @throws {Error} If value is not a valid address string
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
 * @param {*} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @throws {Error} If value is not provided
 */
function requireBytes(value, name = 'bytes') {
  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required`, name, value);
  }
  // Bytes can be string (hex) or Uint8Array
  if (typeof value !== 'string' && !(value instanceof Uint8Array)) {
    throw new ValidationError(`${name} must be a string (hex) or Uint8Array`, name, value);
  }
}

/**
 * Require a string value
 * 
 * @param {String} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @throws {Error} If value is not a string
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
 * @throws {Error} If value is not a valid number or BigInt
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
