/**
 * Translator for ABI encoder failures originating in {@code ethers} ({@code MISSING_ARGUMENT} /
 * {@code INVALID_ARGUMENT}).
 *
 * Produces a generic {@link WalletError} with code {@code "ABI_ENCODER_ERROR"}, optional
 * {@code argumentCount} / {@code expectedArgumentCount} / {@code argument} fields, and a
 * sanitised {@code value} (sensitive arg values like passwords are never copied verbatim).
 *
 * @module errors/translators/ethersEncoder
 */

import { WalletError } from '../WalletError.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * Translate ABI encoder errors emitted by ethers.
 *
 * @public
 * @param {unknown} err - Caught error
 * @param {ErrorTranslationContext} context - Translator context (uses {@code methodName})
 * @returns {WalletError | null} {@link WalletError} with code {@code "ABI_ENCODER_ERROR"} on
 *   match, {@code null} otherwise
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
