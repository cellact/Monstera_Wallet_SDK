/**
 * HD account index defaults for KeyVault operations.
 *
 * @module internal/vault/accountIndex
 */

/** @type {number} */
export const DEFAULT_ACCOUNT_INDEX = 0;

/**
 * @public
 * @param {Record<string, unknown>} options
 * @returns {Record<string, unknown> & { index: number }}
 */
export function withDefaultAccountIndex(options) {
  return {
    ...options,
    index: options.index ?? DEFAULT_ACCOUNT_INDEX
  };
}
