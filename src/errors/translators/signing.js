/**
 * Translator dedicated to signing-side failures emitted by the auth-proof builders.
 *
 * @description Only engages when {@code context.authProofType} and {@code context.functionName}
 * are both set — otherwise returns {@code null} immediately so the rest of the pipeline runs as
 * usual. Distinguishes three buckets:
 * - Transport failures (network / timeout / server) → {@link NetworkError}
 * - ABI encoding failures → {@link ValidationError} on {@code authProof}
 * - Anything else → generic {@link WalletError} with code {@code "UNKNOWN_ERROR"}
 *
 * @typedef {import('../pipeline.js').ErrorTranslationContext} ErrorTranslationContext
 *
 * @module errors/translators/signing
 */

import { NetworkError, ValidationError, WalletError } from '../WalletError.js';

/**
 * Translate signing / EIP-712 / auth-proof builder failures.
 *
 * @public
 * @param {unknown} error - Caught error
 * @param {ErrorTranslationContext} context - Translator context (uses {@code authProofType},
 *   {@code functionName}, {@code validationExtra})
 * @returns {WalletError | NetworkError | ValidationError | null} The categorised error, or
 *   {@code null} when context is missing the auth-proof markers
 */
export function signingTranslator(error, context) {
  const { authProofType, functionName, validationExtra = {} } = context;
  if (!authProofType || !functionName) {
    return null;
  }

  const err = /** @type {{ code?: string; error?: { code?: string }; name?: string; message?: string }} */ (error);
  const errorCode = err.code || err.error?.code;
  const errorMessage = err.message || String(error);

  if (
    errorCode === 'NETWORK_ERROR' ||
    errorCode === 'TIMEOUT' ||
    errorCode === 'SERVER_ERROR' ||
    errorCode === 'UNKNOWN_ERROR' ||
    err.name === 'NetworkError' ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout')
  ) {
    return new NetworkError(
      `Failed to create ${authProofType}: Network error during signing - ${errorMessage}`,
      null,
      /** @type {Error|null} */ (/** @type {any} */ (error))
    );
  }

  if (errorMessage.includes('encode') || errorMessage.includes('ABI')) {
    return new ValidationError(
      `Failed to encode ${authProofType}: ${errorMessage}`,
      'authProof',
      validationExtra
    );
  }

  return new WalletError(`Failed to create ${authProofType}: ${errorMessage}`, 'UNKNOWN_ERROR', {
    function: functionName,
    originalError: errorMessage,
    originalCode: errorCode
  });
}
