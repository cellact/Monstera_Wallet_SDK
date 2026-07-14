/**
 * Pure normalisation helpers used by config + assertion code.
 *
 * @description Both helpers return {@code undefined} on failure rather than throwing, so callers
 * (typically the {@code require*} helpers in {@link ../validation/assert.js}) can wrap them in their own
 * structured {@link ValidationError} messages.
 *
 * @module internal/utils/normalize
 */

/**
 * Normalise an EVM chain id into the {@link ChainId} representation used internally.
 *
 * @description Accepts {@code bigint}, {@code number}, decimal string, or {@code 0x}-hex string.
 * Returns a {@code number} when the value fits in {@link Number.MAX_SAFE_INTEGER}; otherwise
 * returns a lowercase {@code 0x}-hex string. Returns {@code undefined} on missing / non-finite /
 * unparseable input.
 *
 * @public
 * @param {unknown} value - Candidate chain id
 * @returns {ChainId | undefined} Normalised chain id, or {@code undefined}
 */
function normalizeChainId(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  try {
    /** @type {bigint} */
    let b;
    if (typeof value === 'bigint') {
      b = value;
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return undefined;
      }
      b = BigInt(value);
    } else {
      const s = String(value).trim();
      if (s === '') {
        return undefined;
      }
      b = BigInt(s);
    }
    if (b <= BigInt(Number.MAX_SAFE_INTEGER)) {
      return Number(b);
    }
    return /** @type {ChainId} */ ('0x' + b.toString(16));
  } catch {
    return undefined;
  }
}

/**
 * Coerce a value to {@link bigint}.
 *
 * @description Accepts {@code bigint}, finite integer {@code number}, or trimmed decimal /
 * {@code 0x}-hex string. Returns {@code undefined} on missing / invalid input.
 *
 * @public
 * @param {unknown} value - Candidate bigint
 * @returns {bigint | undefined} Coerced value, or {@code undefined}
 */
function normalizeBigInt(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      return undefined;
    }
    try {
      return BigInt(value);
    } catch {
      return undefined;
    }
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (s === '') {
      return undefined;
    }
    try {
      return BigInt(s);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Normalise a username for factory registration (trim + lowercase).
 *
 * @description Matches the convention documented on {@code WalletFactory.createWalletForUsername}:
 * the factory stores only {@code keccak256(bytes(normalizedUsername))}, so callers must apply the
 * same normalisation before hashing or sending plaintext usernames.
 *
 * @public
 * @param {unknown} value - Candidate username
 * @returns {string | undefined} Normalised username, or {@code undefined} when missing/empty after trim
 */
function normalizeUsername(value) {
  if (value === undefined || value === null || typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === '' ? undefined : normalized;
}

/**
 * Normalise a BIP-39 mnemonic phrase (trim, lowercase, collapse whitespace).
 *
 * @description Used before word-count / checksum validation and PBKDF2 seed derivation so callers
 * accept extra surrounding whitespace, mixed casing, and irregular separators.
 *
 * @public
 * @param {unknown} value - Candidate mnemonic phrase
 * @returns {Mnemonic | undefined} Normalised phrase, or {@code undefined} when missing/empty after trim
 */
function normalizeMnemonic(value) {
  if (value === undefined || value === null || typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalized === '' ? undefined : normalized;
}

export { normalizeChainId, normalizeBigInt, normalizeUsername, normalizeMnemonic };
