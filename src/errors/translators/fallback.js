/**
 * Final fallback for unrecognized ethers/RPC errors.
 */

import { WalletError } from '../WalletError.js';
import { sanitizeErrorContextShallow } from '../../internal/sensitiveParams.js';

/**
 * @typedef {import('../pipeline.js').ErrorTranslationContext} ErrorTranslationContext
 */

/**
 * @param {unknown} err
 * @param {ErrorTranslationContext} context
 * @returns {WalletError}
 */
export function fallbackTranslator(err, context) {
  const error = /** @type {Error} */ (err);
  const message = error.message || String(err);
  const errorCode = /** @type {Error & { code?: string }} */ (error).code || /** @type {any} */ (error).error?.code;
  const { methodName = 'operation', sdkContext = {} } = context;

  const safeSdk = sanitizeErrorContextShallow({ ...sdkContext });
  delete /** @type {any} */ (safeSdk).revertInterface;

  return new WalletError(`Failed during ${methodName}: ${message}`, 'UNKNOWN_ERROR', {
    methodName,
    ...safeSdk,
    originalError: message,
    originalCode: errorCode
  });
}
