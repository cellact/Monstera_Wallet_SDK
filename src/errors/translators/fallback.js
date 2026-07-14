/**
 * Last-resort translator that always returns a {@link WalletError}.
 *
 * Sits at the end of the {@link sdkErrorPipeline} so the engine never falls off the end without a
 * translation. Produces a {@code "UNKNOWN_ERROR"} {@link WalletError} with the original message,
 * code, and a sanitised copy of the caller's SDK context (with {@code revertInterface} stripped
 * so we don't end up serialising an entire ABI inside an error).
 *
 * @module errors/translators/fallback
 */

import { WalletError } from '../WalletError.js';
import { sanitizer } from '../../internal/sanitization/index.js';

/**
 * Translate any otherwise-unrecognised error into a generic {@link WalletError}.
 *
 * @public
 * @param {unknown} err - Caught error
 * @param {ErrorTranslationContext} context - Translator context (uses {@code methodName},
 *   {@code sdkContext})
 * @returns {WalletError} A {@link WalletError} with code {@code "UNKNOWN_ERROR"} (never returns
 *   {@code null}; this translator is the pipeline terminator)
 */
export function fallbackTranslator(err, context) {
  const error = /** @type {Error} */ (err);
  const message = error.message || String(err);
  const errorCode = /** @type {Error & { code?: string }} */ (error).code || /** @type {any} */ (error).error?.code;
  const { methodName = 'operation', sdkContext = {} } = context;

  const safeSdk = sanitizer.forErrorContext({ ...sdkContext });
  delete /** @type {any} */ (safeSdk).revertInterface;

  return new WalletError(`Failed during ${methodName}: ${message}`, 'UNKNOWN_ERROR', {
    methodName,
    ...safeSdk,
    originalError: message,
    originalCode: errorCode
  });
}
