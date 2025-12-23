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
 * Require a bytes-like value (string hex or Uint8Array)
 * 
 * @param {*} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @throws {Error} If value is not bytes-like
 */
function requireBytesLike(value, name = 'bytes') {
  requireBytes(value, name);
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
 * Require a number value
 * 
 * @param {Number} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @param {Object} options - Validation options
 * @param {Boolean} [options.allowZero=true] - Allow zero
 * @param {Boolean} [options.allowNegative=false] - Allow negative numbers
 * @param {Boolean} [options.requireInteger=false] - Require integer
 * @throws {Error} If value is not a valid number
 */
function requireNumber(value, name = 'number', options = {}) {
  const { allowZero = true, allowNegative = false, requireInteger = false } = options;

  if (value === undefined || value === null || typeof value !== 'number') {
    throw new ValidationError(`${name} is required and must be a number`, name, value);
  }

  if (!allowZero && value === 0) {
    throw new ValidationError(`${name} must be non-zero`, name, value);
  }

  if (!allowNegative && value < 0) {
    throw new ValidationError(`${name} must be non-negative`, name, value);
  }

  if (requireInteger && !Number.isInteger(value)) {
    throw new ValidationError(`${name} must be an integer`, name, value);
  }
}

/**
 * Require a non-negative integer
 * 
 * @param {Number} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @throws {Error} If value is not a non-negative integer
 */
function requireNonNegativeInteger(value, name = 'number') {
  requireNumber(value, name, { allowZero: true, allowNegative: false, requireInteger: true });
}

/**
 * Require a positive integer
 * 
 * @param {Number} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @throws {Error} If value is not a positive integer
 */
function requirePositiveInteger(value, name = 'number') {
  requireNumber(value, name, { allowZero: false, allowNegative: false, requireInteger: true });
}

/**
 * Require a hex string value
 * 
 * @param {String} value - Value to validate
 * @param {String} name - Parameter name for error message
 * @throws {Error} If value is not a hex string
 */
function requireHex(value, name = 'hex') {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${name} is required and must be a string`, name, value);
  }
  if (!/^0x[a-fA-F0-9]+$/i.test(value)) {
    throw new ValidationError(`${name} must be a valid hex string (0x...)`, name, value);
  }
}

/**
 * Require value to be one of allowed values
 * 
 * @param {*} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {String} name - Parameter name for error message
 * @throws {Error} If value is not one of allowed values
 */
function requireOneOf(value, allowedValues, name = 'value') {
  if (!allowedValues || !Array.isArray(allowedValues) || allowedValues.length === 0) {
    throw new ValidationError('allowedValues must be a non-empty array', 'allowedValues', allowedValues);
  }
  if (!allowedValues.includes(value)) {
    throw new ValidationError(`${name} must be one of: ${allowedValues.join(', ')}`, name, value);
  }
}

module.exports = {
  isAddress,
  requireAddress,
  requireBytes,
  requireBytesLike,
  requireString,
  requireNumber,
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireHex,
  requireOneOf
};
