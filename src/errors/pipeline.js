/**
 * Unified SDK error translation pipeline.
 *
 * @typedef {import('../types/index.js').EthersInterface} EthersInterface
 * @typedef {import('../types/index.js').TransactionReceipt} TransactionReceipt
 */

import { WalletError } from './WalletError.js';
import { sanitizer } from '../internal/sanitization/index.js';

export { decodeCustomError, extractRpcRevertBytes } from './translators/revert.js';

import { revertTranslator } from './translators/revert.js';
import { networkTranslator } from './translators/network.js';
import { signingTranslator } from './translators/signing.js';
import { ethersEncoderTranslator } from './translators/ethersEncoder.js';
import { fallbackTranslator } from './translators/fallback.js';

/**
 * Context passed through translation (read/write/signing).
 *
 * @typedef {Object} ErrorTranslationContext
 * @property {string} [methodName]
 * @property {string|null} [rpcUrl]
 * @property {EthersInterface|null} [revertInterface]
 * @property {Record<string, unknown>} [sdkContext]
 * @property {TransactionReceipt|null|undefined} [receipt]
 * @property {string|null} [transactionHash]
 * @property {string|null} [revertData]
 * @property {string|null} [revertReason]
 * @property {unknown} [revertArgs]
 * @property {string|null} [revertSignature]
 * @property {string} [authProofType] - When set, {@link signingTranslator} runs; {@link networkTranslator} defers.
 * @property {string} [functionName] - Caller id for signing errors.
 * @property {Record<string, unknown>} [validationExtra]
 */

/**
 * @param {WalletError} err
 * @param {Record<string, unknown>} [sdkContext={}]
 */
export function applySdkContext(err, sdkContext = {}) {
  if (!(err instanceof WalletError) || !sdkContext || typeof sdkContext !== 'object') {
    return;
  }
  err.context = { ...(err.context || {}), ...sdkContext };
}

/**
 * Merge {@code sdkContext} onto a {@link WalletError} with sensitive keys redacted (pipeline default).
 *
 * @param {WalletError} err
 * @param {Record<string, unknown>} [sdkContext={}]
 */
function mergeSanitizedSdkContext(err, sdkContext = {}) {
  applySdkContext(err, sanitizer.forErrorContext(sdkContext));
}

/**
 * Turn unknown failures into {@link WalletError} subclasses using ordered translators.
 *
 * @typedef {(error: unknown, context: ErrorTranslationContext) => WalletError | null} ErrorTranslator
 */
export class ErrorPipeline {
  /**
   * @param {ErrorTranslator[]} translators
   */
  constructor(translators = []) {
    this.translators = translators;
  }

  /**
   * @param {unknown} error
   * @param {ErrorTranslationContext} [context={}]
   * @returns {WalletError}
   */
  translate(error, context = {}) {
    const errObj =
      error instanceof Error ? error : new Error(typeof error === 'string' ? error : String(error));

    for (const translator of this.translators) {
      const result = translator(errObj, context);
      if (result) {
        mergeSanitizedSdkContext(result, context.sdkContext);
        return result;
      }
    }

    throw new Error('ErrorPipeline: fallback translator did not return');
  }

  /**
   * @param {unknown} error
   * @param {ErrorTranslationContext} [context={}]
   * @returns {never}
   */
  rethrow(error, context = {}) {
    if (error instanceof WalletError) {
      mergeSanitizedSdkContext(error, context.sdkContext);
      throw error;
    }
    throw this.translate(error, context);
  }
}

/**
 * Shared pipeline for contract clients, write wrapper, and crypto signing.
 *
 * Order: revert → network → signing → ABI encoder → fallback.
 */
export const sdkErrorPipeline = new ErrorPipeline([
  revertTranslator,
  networkTranslator,
  signingTranslator,
  ethersEncoderTranslator,
  /** @type {ErrorTranslator} */ (fallbackTranslator)
]);

/**
 * @param {unknown} err
 * @param {ErrorTranslationContext} options
 * @returns {WalletError}
 */
export function toWalletError(err, options = {}) {
  return sdkErrorPipeline.translate(err, options);
}

/**
 * @param {unknown} err
 * @param {{ methodName: string; rpcUrl: string|null; revertInterface?: EthersInterface|null|undefined; sdkContext: Record<string, unknown> }} opts
 * @returns {never}
 */
export function rethrowExecuteError(err, opts) {
  sdkErrorPipeline.rethrow(err, opts);
}
