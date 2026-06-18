/**
 * Pure validation functions used SDK-wide.
 *
 * Each helper either passes silently or throws {@link ValidationError} so callers can lean on
 * structured error context for diagnostics. Many helpers compose: e.g. {@link requireAddress}
 * defers to {@link requireString} first to give consistent "missing parameter" messages.
 *
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').Mnemonic} Mnemonic
 * @typedef {import('../types/index.js').ChainId} ChainId
 *
 * @module internal/assert
 */

import { ValidationError } from '../errors/index.js';
import { HDNodeWallet, Mnemonic, Wallet } from '../adapters/ethers/index.js';
import { isAddress as ethersIsAddress, isHexString as ethersIsHexString } from '../adapters/ethers/addresses.js';
import { normalizeBigInt, normalizeChainId, normalizeMnemonic, normalizeUsername } from './utils/normalize.js';
import { nowUnixTimestampSeconds } from './utils/time.js';

/**
 * Boolean predicate: is {@code value} a syntactically valid EVM address?
 *
 * @description Defers to {@code ethers.isAddress}; mixed-case input is treated as EIP-55 and the
 * checksum is enforced. Lower-case / upper-case (non-mixed) input is accepted.
 *
 * @public
 * @param {unknown} value - Candidate value
 * @returns {boolean} {@code true} when {@code value} is a string ethers accepts as an address
 */
function isAddress(value) {
  return typeof value === 'string' && ethersIsAddress(value);
}

/**
 * Assert that {@code value} is a valid EVM address.
 *
 * @public
 * @param {string} value - Value to validate
 * @param {string} [name='address'] - Parameter name for the resulting error message
 * @returns {void}
 * @throws {ValidationError} If {@code value} fails {@link requireString} or is not a valid address
 */
function requireAddress(value, name = 'address') {
  requireString(value, name);
  if (!isAddress(value)) {
    throw new ValidationError(`${name} must be a valid Ethereum address`, name, value);
  }
}

/**
 * Assert that {@code value} is a valid bytes value (either a {@code 0x}-prefixed hex string or a
 * {@link Uint8Array}).
 *
 * @description Allows the empty hex string {@code "0x"} and zero-length Uint8Arrays — use
 * {@link requireNonEmptyBytes} when empty bytes are not acceptable.
 *
 * @public
 * @param {string | Uint8Array} value - Value to validate
 * @param {string} [name='bytes'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} is missing, a string that is not valid hex, or any
 *   other non-{@link Uint8Array} value
 */
function requireBytes(value, name = 'bytes') {
  // Allows `0x` (empty hex); use {@link requireNonEmptyBytes} when empty bytes are invalid.
  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required`, name, value);
  }
  
  // Uint8Array is always valid bytes
  if (value instanceof Uint8Array) {
    return;
  }
  
  // String must be valid hex
  if (typeof value === 'string') {
    if (!/^0x[a-fA-F0-9]*$/.test(value)) {
      throw new ValidationError(`${name} must be a valid hex string (0x...) or Uint8Array`, name, value);
    }
    return;
  }
  
  throw new ValidationError(`${name} must be a string (hex) or Uint8Array`, name, value);
}

/**
 * Assert that {@code value} is non-empty bytes.
 *
 * @description Composes {@link requireBytes} and additionally rejects {@code "0x"} and
 * zero-length {@link Uint8Array}.
 *
 * @public
 * @param {string | Uint8Array} value - Value to validate
 * @param {string} [name='bytes'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} fails {@link requireBytes} or is empty bytes
 */
function requireNonEmptyBytes(value, name = 'bytes') {
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
 * Assert that {@code value} is exactly a 32-byte {@code 0x}-prefixed hex string.
 *
 * @public
 * @param {string} value - Value to validate
 * @param {string} [name='bytes32'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} fails {@link requireString} or is not a 32-byte hex
 *   string per {@code ethers.isHexString(value, 32)}
 */
function requireBytes32(value, name = 'bytes32') {
  requireString(value, name);
  if (!ethersIsHexString(value, 32)) {
    throw new ValidationError(`${name} must be a 32-byte hex string value`, name, value);
  }
}

/**
 * Assert that {@code value} is a non-empty {@link Uint8Array}.
 *
 * @description Used by the password authProof encoder to require pre-UTF-8-encoded password bytes
 * (so plaintext strings never travel through the SDK).
 *
 * @public
 * @param {Uint8Array} value - Value to validate
 * @param {string} [name='utf8Bytes'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} is not a {@link Uint8Array} or has length 0
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
 * Assert that {@code value} is a non-empty string.
 *
 * @public
 * @param {string} value - Value to validate
 * @param {string} [name='string'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} is missing, not a string, empty, or whitespace-only
 */
function requireString(value, name = 'string') {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${name} is required and must be a non-empty string`, name, value);
  }
}

/**
 * Assert that {@code value} is a non-empty username and return the factory-normalised form.
 *
 * @description Applies trim + lowercase via {@link normalizeUsername}, matching
 * {@code WalletFactory.createWalletForUsername} before hashing or on-chain registration.
 *
 * @public
 * @param {unknown} value - Candidate username
 * @param {string} [name='username'] - Parameter name
 * @returns {string} Normalised username
 * @throws {ValidationError} If {@code value} is missing or empty after normalisation
 */
function requireNormalizedUsername(value, name = 'username') {
  const normalized = normalizeUsername(value);
  if (normalized === undefined) {
    throw new ValidationError(`${name} is required and must be a non-empty string`, name, value);
  }
  return normalized;
}

/**
 * Assert that {@code value} is a valid BIP-39 mnemonic phrase.
 *
 * @description Normalises whitespace before counting words, accepts 12-word or 24-word phrases,
 * and runs {@code ethers.Mnemonic.isValidMnemonic} for wordlist / checksum verification.
 *
 * @public
 * @param {Mnemonic} value - Value to validate
 * @param {string} [name='mnemonic'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} fails {@link requireString}, is not 12 or 24 words,
 *   or fails {@code Mnemonic.isValidMnemonic} (invalid words / checksum)
 */
function requireMnemonic(value, name = 'mnemonic') {
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
 * Assert that {@code value} is a number (supports {@code number} and {@code bigint}).
 *
 * @description Configurable via {@code options} for zero, negative, and integer constraints. Used
 * as the building block for the more specific {@link requireNonNegativeInteger} and
 * {@link requirePositiveInteger}.
 *
 * @public
 * @param {number | bigint} value - Value to validate
 * @param {string} [name='number'] - Parameter name
 * @param {{ allowZero?: boolean, allowNegative?: boolean, requireInteger?: boolean }} [options={}] -
 *   Constraint flags
 * @returns {void}
 * @throws {ValidationError} If {@code value} is missing, not a number / bigint, violates
 *   {@code allowZero}, violates {@code allowNegative}, or violates {@code requireInteger}
 */
function requireNumber(value, name = 'number', options = {}) {
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
 * Assert that {@code value} is a non-negative integer ({@code number} or {@code bigint}).
 *
 * @public
 * @param {number | bigint} value - Value to validate
 * @param {string} [name='number'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} Forwarded from {@link requireNumber}
 */
function requireNonNegativeInteger(value, name = 'number') {
  requireNumber(value, name, { allowZero: true, allowNegative: false, requireInteger: true });
}

/**
 * Assert that {@code value} is a positive (non-zero) integer ({@code number} or {@code bigint}).
 *
 * @public
 * @param {number | bigint} value - Value to validate
 * @param {string} [name='number'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} Forwarded from {@link requireNumber}
 */
function requirePositiveInteger(value, name = 'number') {
  requireNumber(value, name, { allowZero: false, allowNegative: false, requireInteger: true });
}

/**
 * Assert that {@code value} is a non-empty array.
 *
 * @public
 * @param {Array} value - Value to validate
 * @param {string} [name='array'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} is not an array, or has length 0
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
 * Assert that {@code value} is an ethers {@code Wallet} or {@code HDNodeWallet}.
 *
 * @description Used by the auth-proof builders that need a real signer instance (private-key or
 * HD-derived) — does NOT accept arbitrary signer-shaped duck types.
 *
 * @public
 * @param {Wallet | HDNodeWallet} value - Value to validate
 * @param {string} [name='signer'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} is missing or not an instance of either class
 */
function requireWalletOrHdNode(value, name = 'signer') {
  if (!value || !(value instanceof Wallet || value instanceof HDNodeWallet)) {
    throw new ValidationError(`${name} is required and must be a Wallet or HDNodeWallet`, name, value);
  }
}

/**
 * Assert that {@code value} is a non-empty string or a non-zero number.
 *
 * @public
 * @param {string | number} value - Value to validate
 * @param {string} [name='string or number'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} is missing or not a string / number
 */
function requireStringOrNumber(value, name = 'string or number') {
  if (!value || typeof value !== 'string' && typeof value !== 'number') {
    throw new ValidationError(`${name} is required and must be a string or number`, name, value);
  }
}

/**
 * Assert that {@code value} is parseable to a finite EVM chain id and return the normalised value.
 *
 * @description Accepts {@code number}, {@code bigint}, decimal string, or {@code 0x}-prefixed hex
 * string; defers to {@link normalizeChainId} for parsing.
 *
 * @public
 * @param {unknown} value - Value to validate
 * @param {string} [name='chainId'] - Parameter name
 * @returns {ChainId} Normalised chain id
 * @throws {ValidationError} If {@code value} is missing or {@link normalizeChainId} returns
 *   {@code undefined}
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
 * Assert that {@code value} is parseable to a finite {@link bigint} and return it.
 *
 * @description Accepts {@code bigint}, safe-integer {@code number}, or non-empty decimal /
 * {@code 0x}-hex string; defers to {@link normalizeBigInt}.
 *
 * @public
 * @param {unknown} value - Value to validate
 * @param {string} [name='value'] - Parameter name
 * @param {{ allowNegative?: boolean }} [options={}] - When {@code allowNegative === false},
 *   negative values throw
 * @returns {bigint} Normalised value
 * @throws {ValidationError} If {@code value} is missing, not coercible, or when negative values
 *   are forbidden and the value is negative
 */
function requireBigInt(value, name = 'value', options = {}) {
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
 * Assert that {@code value} is a Unix timestamp (seconds) strictly in the future.
 *
 * @description Used by deadline assertions in the auth-proof builders.
 *
 * @public
 * @param {number} value - Unix timestamp in seconds
 * @param {string} [name='date'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} is not in the future relative to {@link nowUnixTimestampSeconds}
 */
function isInFuture(value, name = 'date') {
  const nowInSeconds = nowUnixTimestampSeconds();
  if (value < nowInSeconds) {
    throw new ValidationError(`${name} must be in the future`, name, value);
  }
}

/**
 * Assert that {@code value} is a boolean.
 *
 * @public
 * @param {boolean} value - Value to validate
 * @param {string} [name='boolean'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} is not a {@code boolean}
 */
function requireBoolean(value, name = 'boolean') {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${name} is required and must be a boolean`, name, value);
  }
}

/**
 * Predicate: is {@code value} a plain object (not {@code null}, not an array)?
 *
 * @public
 * @param {unknown} value - Candidate value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Assert that {@code value} is defined (not {@code null} or {@code undefined}).
 *
 * @public
 * @param {unknown} value - Value to validate
 * @param {string} [name='value'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} is {@code null} or {@code undefined}
 */
function requireDefined(value, name = 'value') {
  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required`, name, value);
  }
}

/**
 * Assert that {@code provider} exposes a named method.
 *
 * @public
 * @param {unknown} provider - Candidate provider
 * @param {string} method - Method name (e.g. {@code 'getBlock'})
 * @param {string} [name='provider'] - Parameter name for errors
 * @param {{ message?: string }} [options={}] - Optional custom error message
 * @returns {void}
 * @throws {ValidationError} If {@code provider} is missing or does not expose {@code method}
 */
function requireProviderMethod(provider, method, name = 'provider', options = {}) {
  const { message } = options;

  if (!provider || typeof /** @type {Record<string, unknown>} */ (provider)[method] !== 'function') {
    throw new ValidationError(
      message ?? `${name} must expose ${method}()`,
      name,
      provider
    );
  }
}

/**
 * Assert that {@code value} is a plain object ({@code {}}, not an array).
 *
 * @public
 * @param {unknown} value - Value to validate
 * @param {string} [name='object'] - Parameter name
 * @param {{ requireNonEmpty?: boolean, message?: string }} [options={}] - When
 *   {@code requireNonEmpty} is {@code true}, empty {@code {}} throws
 * @returns {void}
 * @throws {ValidationError} If {@code value} is missing, not a plain object, or empty when
 *   {@code requireNonEmpty} is set
 */
function requirePlainObject(value, name = 'object', options = {}) {
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
 * Assert that {@code value} is a non-empty plain object (at least one own key, not an array).
 *
 * @public
 * @param {unknown} value - Value to validate
 * @param {string} [name='object'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} Forwarded from {@link requirePlainObject}
 */
function requireNonEmptyObject(value, name = 'object') {
  requirePlainObject(value, name, { requireNonEmpty: true });
}

/**
 * Assert that {@code value} is a 4-byte hex string.
 *
 * @public
 * @param {string} value - Value to validate
 * @param {string} [name='bytes4'] - Parameter name
 * @returns {void}
 * @throws {ValidationError} If {@code value} is not a 4-byte hex string
 */
function requireBytes4(value, name = 'bytes4') {
  requireString(value, name);
  // if (!/^0x[0-9a-fA-F]{8}$/.test(value)) {
  if (!ethersIsHexString(value, 4)) {
    throw new ValidationError(`${name} must be a 4-byte hex string`, name, value);
  }
}

export {
  isAddress,
  isPlainObject,
  requireAddress,
  requireBytes,
  requireNonEmptyBytes,
  requireString,
  requireNormalizedUsername,
  requireMnemonic,
  requireNumber,
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireArray, 
  requireBytes32,
  requireWalletOrHdNode, 
  requireStringOrNumber,
  requireChainId,
  requireBigInt,
  isInFuture,
  requireBoolean,
  requireUtf8Bytes,
  requireDefined,
  requireProviderMethod,
  requirePlainObject,
  requireNonEmptyObject,
  requireBytes4
};
