/**
 * Translator for transport-level RPC / provider failures.
 *
 * Recognises the canonical ethers v6 error codes ({@code NETWORK_ERROR}, {@code TIMEOUT},
 * {@code SERVER_ERROR}, {@code UNKNOWN_ERROR}) and the bare {@code error.name === 'NetworkError'}
 * shape. Defers when {@code authProofType} is set so the {@link signingTranslator} gets the first
 * shot at signing-related failures.
 *
 * @typedef {import('../pipeline.js').ErrorTranslationContext} ErrorTranslationContext
 *
 * @module errors/translators/network
 */

import { NetworkError } from '../WalletError.js';

/**
 * Translate provider / JSON-RPC transport failures into {@link NetworkError}.
 *
 * @public
 * @param {unknown} err - Caught error
 * @param {ErrorTranslationContext} context - Translator context (uses {@code methodName},
 *   {@code rpcUrl}, {@code authProofType})
 * @returns {import('../WalletError.js').NetworkError | null} {@link NetworkError} on match,
 *   {@code null} when the error is not transport-shaped or {@code authProofType} is set
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
