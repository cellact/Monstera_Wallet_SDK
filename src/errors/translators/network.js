/**
 * Network / RPC-style error patterns (ethers provider & JSON-RPC).
 */

import { NetworkError } from '../WalletError.js';

/**
 * @typedef {import('../pipeline.js').ErrorTranslationContext} ErrorTranslationContext
 */

/**
 * @param {unknown} err
 * @param {ErrorTranslationContext} context
 * @returns {import('../WalletError.js').NetworkError | null}
 */
export function networkTranslator(err, context) {
  if (context.authProofType) {
    return null;
  }

  const error = /** @type {Error} */ (err);
  const message = error.message || String(err);
  const errorCode = /** @type {Error & { code?: string }} */ (error).code || /** @type {any} */ (error).error?.code;
  const { methodName = 'operation', rpcUrl = null } = context;

  if (
    errorCode === 'NETWORK_ERROR' ||
    errorCode === 'TIMEOUT' ||
    errorCode === 'SERVER_ERROR' ||
    errorCode === 'UNKNOWN_ERROR' ||
    error.name === 'NetworkError'
  ) {
    return new NetworkError(`Network error: ${message} during ${methodName}`, rpcUrl, error);
  }

  return null;
}
