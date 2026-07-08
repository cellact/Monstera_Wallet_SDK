/**
 * ApiKeySession proof mode inference for TOKEN vs ACTION encoding.
 *
 * @module internal/auth/apiKeySession/mode
 */

/**
 * @param {Record<string, unknown>} input
 * @returns {boolean}
 */
export function isApiKeySessionTokenMode(input) {
  if (input.mode === 'action') {
    return false;
  }
  if (input.mode === 'token') {
    return true;
  }
  return input.expiry != null || input.scopeMask != null;
}
