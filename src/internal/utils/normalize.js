/**
 * Pure normalization helpers (no throws).
 *
 * @typedef {import('../../types/index.js').ChainId} ChainId
 */

/**
 * Normalize an EVM chain id for config / ethers (integer number when ≤ {@link Number.MAX_SAFE_INTEGER}, else lowercase hex string).
 *
 * @param {unknown} value
 * @returns {ChainId | undefined}
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

export { normalizeChainId };
