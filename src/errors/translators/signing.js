/**
 * EIP-712 / signer failures for auth-proof builders (replaces signingErrorMapper).
 */

import { NetworkError, ValidationError, WalletError } from '../WalletError.js';

/**
 * @typedef {import('../pipeline.js').ErrorTranslationContext} ErrorTranslationContext
 */

/**
 * @param {unknown} error
 * @param {ErrorTranslationContext} context
 * @returns {WalletError | NetworkError | ValidationError | null}
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
