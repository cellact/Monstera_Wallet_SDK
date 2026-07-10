/**
 * Unified error translation pipeline used by every SDK code path.
 *
 * The pipeline turns arbitrary thrown values (ethers errors, RPC failures, signing failures,
 * fetch errors, plain {@code Error} instances, strings, etc.) into a single {@link WalletError}
 * subclass with stable codes and sanitised context. It runs an ordered list of translators
 * (see {@link sdkErrorPipeline}) and short-circuits on the first match.
 *
 * Public surface:
 * - {@link ErrorPipeline} class — generic ordered-translator engine
 * - {@link sdkErrorPipeline} — shared singleton pre-configured with the default translator order
 * - {@link toWalletError} / {@link rethrowExecuteError} — convenience wrappers around the singleton
 * - {@link applySdkContext} — merge extra context onto an existing {@link WalletError}
 *
 * @module errors/pipeline
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
 * Context object passed to every translator describing the call site.
 *
 * @typedef {Object} ErrorTranslationContext
 * @property {string} [methodName] - Public method on the originating client (e.g. {@code "createWallet"})
 * @property {string | null} [rpcUrl] - RPC URL associated with the call (used by network translator)
 * @property {EthersInterface | null} [revertInterface] - Contract interface used by the revert translator to decode custom errors
 * @property {Record<string, unknown>} [sdkContext] - Free-form context merged onto the produced {@link WalletError}
 * @property {TransactionReceipt | null | undefined} [receipt] - Transaction receipt for write flows
 * @property {string | null} [transactionHash] - Transaction hash for write flows
 * @property {string | null} [revertData] - Pre-extracted revert data for the revert translator
 * @property {string | null} [revertReason] - Pre-extracted human-readable revert reason
 * @property {unknown} [revertArgs] - Pre-decoded custom error arguments
 * @property {string | null} [revertSignature] - Pre-decoded custom error signature
 * @property {string} [authProofType] - When set, {@link signingTranslator} engages and {@link networkTranslator} defers
 * @property {string} [functionName] - Caller id used by the signing translator
 * @property {Record<string, unknown>} [validationExtra] - Extra context for {@link ValidationError}-shaped failures
 */

/**
 * Shape of a translator function in the pipeline.
 *
 * @typedef {(error: unknown, context: ErrorTranslationContext) => WalletError | null} ErrorTranslator
 */

/**
 * Merge an arbitrary context bag onto an existing {@link WalletError}.
 *
 * @description No-op when {@code err} is not a {@link WalletError} or {@code sdkContext} is not an
 * object. Does NOT sanitise the merged keys — callers that consume untrusted input should run
 * {@code sanitizer.forErrorContext} first (see {@link mergeSanitizedSdkContext}).
 *
 * @public
 * @param {WalletError} err - Target error (mutated in place)
 * @param {Record<string, unknown>} [sdkContext={}] - Context to merge
 * @returns {void}
 */
export function applySdkContext(err, sdkContext = {}) {
  if (!(err instanceof WalletError) || !sdkContext || typeof sdkContext !== 'object') {
    return;
  }
  err.context = { ...(err.context || {}), ...sdkContext };
}

/**
 * Merge {@code sdkContext} onto a {@link WalletError} after running it through the sanitizer.
 *
 * @description Internal helper used by {@link ErrorPipeline.translate} and
 * {@link ErrorPipeline.rethrow} so every {@link WalletError} that exits the pipeline has its
 * sensitive context keys redacted.
 *
 * @private
 * @param {WalletError} err - Target error (mutated in place)
 * @param {Record<string, unknown>} [sdkContext={}] - Context to sanitise + merge
 * @returns {void}
 */
function mergeSanitizedSdkContext(err, sdkContext = {}) {
  applySdkContext(err, sanitizer.forErrorContext(sdkContext));
}

/**
 * Ordered translator engine that converts arbitrary thrown values into {@link WalletError}.
 *
 * @description Translators are tried in the order given to the constructor. The first one that
 * returns a non-null {@link WalletError} wins; remaining translators are not consulted. The
 * default {@link sdkErrorPipeline} terminates with the {@code fallbackTranslator} which always
 * returns a {@link WalletError}, so {@link translate} never throws an internal error in practice.
 *
 * @public
 */
export class ErrorPipeline {
  /**
   * @public
   * @param {ErrorTranslator[]} [translators=[]] - Ordered translator list. Should end with a
   *   never-null fallback translator to guarantee {@link translate} returns.
   */
  constructor(translators = []) {
    this.translators = translators;
  }

  /**
   * Translate an unknown thrown value into a {@link WalletError}.
   *
   * @description Coerces non-Error values into {@link Error} first, runs every translator in
   * order, and merges {@code context.sdkContext} (sanitised) onto the produced error.
   *
   * @public
   * @param {unknown} error - The thrown value (Error, string, primitive, object…)
   * @param {ErrorTranslationContext} [context={}] - Translation context (method name, RPC URL, etc.)
   * @returns {WalletError} A subclass of {@link WalletError} produced by the matching translator
   * @throws {Error} If no translator (including the fallback) returns a value — indicates a
   *   programmer error in the pipeline configuration
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
   * Rethrow an error, translating it first if it isn't already a {@link WalletError}.
   *
   * @description When {@code error} is already a {@link WalletError}, only the (sanitised)
   * {@code sdkContext} is merged onto it before rethrowing — the existing error class and code are
   * preserved. Otherwise {@link translate} is used to produce the {@link WalletError} that gets
   * thrown. Always exits via {@code throw}, hence {@code never} return type.
   *
   * @public
   * @param {unknown} error - Original thrown value
   * @param {ErrorTranslationContext} [context={}] - Translation context
   * @returns {never}
   * @throws {WalletError} Always — either the original (with merged context) or a translated copy
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
 * Process-wide singleton pipeline used by every contract client and crypto helper.
 *
 * @description Translator order:
 * 1. {@code revertTranslator} — decodes EVM reverts (custom errors, {@code Error(string)})
 * 2. {@code networkTranslator} — RPC connectivity / transport failures
 * 3. {@code signingTranslator} — signing-side failures (only when {@code authProofType} is set)
 * 4. {@code ethersEncoderTranslator} — ABI encoding / decoding failures
 * 5. {@code fallbackTranslator} — guaranteed last-resort that always returns a {@link WalletError}
 *
 * @public
 * @readonly
 * @type {ErrorPipeline}
 */
export const sdkErrorPipeline = new ErrorPipeline([
  revertTranslator,
  networkTranslator,
  signingTranslator,
  ethersEncoderTranslator,
  /** @type {ErrorTranslator} */ (fallbackTranslator)
]);

/**
 * Convenience wrapper around {@link sdkErrorPipeline.translate}.
 *
 * @public
 * @param {unknown} err - The thrown value
 * @param {ErrorTranslationContext} [options={}] - Translation context
 * @returns {WalletError} A {@link WalletError} subclass
 */
export function toWalletError(err, options = {}) {
  return sdkErrorPipeline.translate(err, options);
}

/**
 * Convenience wrapper around {@link sdkErrorPipeline.rethrow}, with the narrow option shape used
 * by {@code BaseContractClient.executeRead} / {@code executeWrite}.
 *
 * @public
 * @param {unknown} err - The thrown value
 * @param {{ methodName: string; rpcUrl: string | null; revertInterface?: EthersInterface | null | undefined; sdkContext: Record<string, unknown> }} opts -
 *   Required execute-time context
 * @returns {never}
 * @throws {WalletError} Always
 */
export function rethrowExecuteError(err, opts) {
  sdkErrorPipeline.rethrow(err, opts);
}
