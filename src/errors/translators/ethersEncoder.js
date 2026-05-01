/**
 * ABI encoder errors from ethers (MISSING_ARGUMENT / INVALID_ARGUMENT).
 */

import { WalletError } from '../WalletError.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * @typedef {import('../pipeline.js').ErrorTranslationContext} ErrorTranslationContext
 */

/**
 * @param {unknown} err
 * @param {ErrorTranslationContext} context
 * @returns {WalletError | null}
 */
export function ethersEncoderTranslator(err, context) {
  const error = /** @type {Error & { code?: string }} */ (err);
  const errorCode = error.code || /** @type {any} */ (error).error?.code;
  if (errorCode !== 'MISSING_ARGUMENT' && errorCode !== 'INVALID_ARGUMENT') {
    return null;
  }

  const message = error.message || String(err);
  const { methodName = 'operation' } = context;
  const e = /** @type {Error & { count?: number; expectedCount?: number; argument?: string; value?: unknown }} */ (
    error
  );
  const argLabel = e.argument != null ? String(e.argument) : '';

  return new WalletError(`ABI encoding failed during ${methodName}: ${message}`, 'ABI_ENCODER_ERROR', {
    methodName,
    originalError: message,
    originalCode: errorCode,
    ...(e.count != null ? { argumentCount: e.count } : {}),
    ...(e.expectedCount != null ? { expectedArgumentCount: e.expectedCount } : {}),
    ...(e.argument != null ? { argument: e.argument } : {}),
    ...(e.value !== undefined ? { value: sanitizer.forEncoderValue(argLabel, e.value) } : {})
  });
}
