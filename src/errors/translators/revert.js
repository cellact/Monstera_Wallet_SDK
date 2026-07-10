/**
 * Revert decoding helpers and the {@code CALL_EXCEPTION} / {@code UNPREDICTABLE_GAS_LIMIT}
 * translator.
 *
 * Public helpers ({@link extractRpcRevertBytes}, {@link decodeCustomError}) are reused outside
 * the pipeline by {@code ExecutionPipeline} when it pre-decodes mined-transaction reverts.
 *
 * @typedef {import('../pipeline.js').ErrorTranslationContext} ErrorTranslationContext
 *
 * @module errors/translators/revert
 */

import {
  WalletError,
  NetworkError,
  ContractRevertError
} from '../WalletError.js';

/**
 * Pull revert bytes out of an ethers / RPC error envelope.
 *
 * @description Inspects {@code err.data}, {@code err.error.data}, and {@code err.info.error.data}
 * (the three places ethers v6 surfaces revert payloads from different RPC shapes) and returns the
 * first valid {@code 0x}-prefixed hex string that is at least 4-byte selector + something.
 *
 * @public
 * @param {unknown} err - Caught error (any shape; safe on non-objects)
 * @returns {string | null} Revert bytes (hex) or {@code null} when no payload is present
 */
export function extractRpcRevertBytes(err) {
  let d = /** @type {{ data?: unknown }} */ (err).data;
  if (typeof d !== 'string' || d.length < 10) {
    d = /** @type {{ error?: { data?: unknown } }} */ (err).error?.data;
  }
  if (typeof d !== 'string' || d.length < 10) {
    const info = /** @type {{ error?: { data?: unknown } }} */ (err).info;
    d = info?.error?.data;
  }
  if (typeof d === 'string' && d.startsWith('0x') && d.length >= 10) {
    return d;
  }
  return null;
}

/**
 * Decode custom Solidity error bytes against a contract ABI.
 *
 * @description Wraps ethers v6 {@code Interface.parseError}. Returns an all-{@code null} result
 * (instead of throwing) when {@code iface} or {@code data} are missing, the selector is unknown
 * to the ABI, or {@code parseError} throws — callers downstream rely on this never raising.
 *
 * @public
 * @param {EthersInterface | null} iface - Contract interface to decode against
 * @param {string} data - Revert bytes (hex)
 * @returns {{ revertReason: string | null, revertArgs: unknown, revertSignature: string | null }}
 *   Decoded fields. {@code revertReason} is the custom error name; {@code revertArgs} is the
 *   ethers {@code Result} array (or {@code null} when none); {@code revertSignature} is the
 *   canonical {@code "Name(arg0type,arg1type)"} string.
 */
export function decodeCustomError(iface, data) {
  if (!iface || !data) {
    return { revertReason: null, revertArgs: null, revertSignature: null };
  }
  try {
    const parsed = iface.parseError(data);
    if (!parsed) {
      return { revertReason: null, revertArgs: null, revertSignature: null };
    }
    const revertArgs = parsed.args != null && parsed.args.length ? parsed.args : null;
    const revertSignature =
      typeof parsed.signature === 'string' && parsed.signature.length > 0 ? parsed.signature : null;
    return { revertReason: parsed.name, revertArgs, revertSignature };
  } catch {
    return { revertReason: null, revertArgs: null, revertSignature: null };
  }
}

/**
 * Pull the nested {@code error.message} string out of an ethers v6 RPC error envelope.
 *
 * @private
 * @param {Error} err - Caught ethers error
 * @returns {string | null} Nested message or {@code null}
 */
function nestedRpcMessage(err) {
  const info = /** @type {{ error?: { message?: string } }} */ (err).info;
  const nested = info?.error?.message;
  return typeof nested === 'string' && nested.length > 0 ? nested : null;
}

/**
 * Copy the optional decoded revert fields onto an extra-context bag.
 *
 * @private
 * @param {Record<string, unknown>} extra - Mutated in place
 * @param {{ revertArgs?: unknown, revertSignature?: string | null }} source - Decoded fields
 * @returns {void}
 */
function assignRevertExtras(extra, source) {
  if (source.revertArgs != null) {
    extra.revertArgs = source.revertArgs;
  }
  if (source.revertSignature) {
    extra.revertSignature = source.revertSignature;
  }
}

/**
 * Resolve the final revert reason / args / signature triple from any combination of ethers
 * fields and pre-decoded values supplied via context.
 *
 * @description Precedence for the reason: explicit {@code revertReason} > {@code err.revert.name}
 * > {@code err.reason} > decoded custom error name. {@code revertArgs} prefers the existing value;
 * the decoded signature is always the ABI-resolved one.
 *
 * @private
 * @param {EthersInterface | null | undefined} iface - Contract interface (optional)
 * @param {string | null} revertData - Revert bytes (hex)
 * @param {string | null} revertReason - Pre-decoded reason
 * @param {unknown} revertArgsExisting - Pre-decoded args
 * @param {Error & { reason?: string; revert?: { name?: string } }} err - Underlying ethers error
 * @returns {{ revertReason: string | null, revertArgs: unknown, revertSignature: string | null }}
 *   Resolved fields
 */
function resolveRevertFields(iface, revertData, revertReason, revertArgsExisting, err) {
  let revertReasonOut =
    (typeof revertReason === 'string' && revertReason) ||
    (typeof err.revert?.name === 'string' && err.revert.name) ||
    (typeof err.reason === 'string' && err.reason) ||
    null;
  /** @type {unknown} */
  let revertArgsOut = revertArgsExisting;
  /** @type {string | null} */
  let revertSignatureOut = null;

  if (revertData && iface) {
    const decoded = decodeCustomError(iface, revertData);
    if (!revertReasonOut && decoded.revertReason) {
      revertReasonOut = decoded.revertReason;
    }
    if (decoded.revertArgs != null && revertArgsOut == null) {
      revertArgsOut = decoded.revertArgs;
    }
    if (decoded.revertSignature) {
      revertSignatureOut = decoded.revertSignature;
    }
  }

  return { revertReason: revertReasonOut, revertArgs: revertArgsOut, revertSignature: revertSignatureOut };
}

/**
 * Build the {@code (revertData, resolved, extra)} triple consumed by {@link revertTranslator}.
 *
 * @description Extracts revert bytes from the error (or accepts a pre-extracted value via
 * {@code enrichRevertData}), resolves the reason / args / signature via
 * {@link resolveRevertFields}, and packs decoded extras into a context bag.
 *
 * @private
 * @param {Error} err - Underlying ethers error
 * @param {EthersInterface | null} revertInterface - ABI for custom error decoding (optional)
 * @param {string | null | undefined} enrichRevertData - Pre-extracted revert bytes
 * @param {string | null | undefined} enrichRevertReason - Pre-decoded reason
 * @param {unknown} enrichRevertArgs - Pre-decoded args
 * @param {string | null | undefined} enrichRevertSignature - Pre-decoded signature
 * @returns {{ revertData: string | null, resolved: { revertReason: string | null, revertArgs: unknown, revertSignature: string | null }, extra: Record<string, unknown> }}
 *   Triple ready for use in {@link ContractRevertError} construction
 */
function buildCallExceptionRevertDetails(
  err,
  revertInterface,
  enrichRevertData,
  enrichRevertReason,
  enrichRevertArgs,
  enrichRevertSignature
) {
  const revertData =
    (typeof enrichRevertData === 'string' && enrichRevertData) ||
    extractRpcRevertBytes(err) ||
    /** @type {any} */ (err).data ||
    null;
  const resolved = resolveRevertFields(
    revertInterface,
    revertData,
    enrichRevertReason,
    enrichRevertArgs,
    /** @type {any} */ (err)
  );
  /** @type {Record<string, unknown>} */
  const extra = {};
  assignRevertExtras(extra, {
    revertArgs: resolved.revertArgs,
    revertSignature: resolved.revertSignature || enrichRevertSignature
  });
  return { revertData, resolved, extra };
}

/**
 * Translate ethers {@code CALL_EXCEPTION} / {@code UNPREDICTABLE_GAS_LIMIT} errors.
 *
 * @description This is the first translator run by the {@link sdkErrorPipeline}. It only matches
 * when the error code is one of the two listed; otherwise returns {@code null} so the next
 * translator gets a chance.
 *
 * Behaviour:
 * - When a transaction hash + receipt are available (mined revert) → returns
 *   {@link ContractRevertError} with the receipt and decoded revert info.
 * - When revert data / reason are present without a receipt (pre-flight call) → returns a
 *   {@link ContractRevertError} without receipt.
 * - When neither is present (likely an RPC connection failure surfacing via CALL_EXCEPTION) →
 *   returns a {@link NetworkError} carrying the original error.
 *
 * @public
 * @param {unknown} err - Caught error
 * @param {ErrorTranslationContext} context - Translator context
 * @returns {WalletError | null} {@link ContractRevertError} or {@link NetworkError} on match,
 *   {@code null} otherwise
 */
export function revertTranslator(err, context) {
  const error = /** @type {Error} */ (err);
  const errorCode = /** @type {Error & { code?: string }} */ (error).code || /** @type {any} */ (error).error?.code;
  if (errorCode !== 'CALL_EXCEPTION' && errorCode !== 'UNPREDICTABLE_GAS_LIMIT') {
    return null;
  }

  const {
    methodName = 'operation',
    rpcUrl = null,
    revertInterface = null,
    receipt: receiptOpt,
    transactionHash: txHashOpt,
    revertData: enrichRevertData,
    revertReason: enrichRevertReason,
    revertArgs: enrichRevertArgs,
    revertSignature: enrichRevertSignature = null
  } = context;

  const message = error.message || String(error);
  /** @type {string | undefined} */
  const action = typeof /** @type {any} */ (error).action === 'string' ? /** @type {any} */ (error).action : undefined;
  const nestedRpc = nestedRpcMessage(error);

  const receipt = /** @type {TransactionReceipt | null | undefined} */ (
    receiptOpt ?? /** @type {any} */ (error).receipt
  );
  const txHash =
    (typeof txHashOpt === 'string' && txHashOpt && txHashOpt.length > 0 ? txHashOpt : null) ||
    (receipt && typeof receipt.hash === 'string' ? receipt.hash : null);

  if (txHash && receipt) {
    const { revertData, resolved, extra } = buildCallExceptionRevertDetails(
      error,
      revertInterface ?? null,
      enrichRevertData,
      enrichRevertReason,
      enrichRevertArgs,
      enrichRevertSignature
    );
    const summary = resolved.revertReason
      ? `Transaction reverted: ${resolved.revertReason}`
      : `Transaction reverted: ${message}`;
    return new ContractRevertError(
      summary,
      revertData,
      resolved.revertReason,
      txHash,
      receipt,
      extra
    );
  }

  const { revertData, resolved, extra } = buildCallExceptionRevertDetails(
    error,
    revertInterface ?? null,
    enrichRevertData,
    enrichRevertReason,
    enrichRevertArgs,
    enrichRevertSignature
  );
  const hasRevert = !!(revertData || resolved.revertReason || /** @type {any} */ (error).revert);
  if (hasRevert) {
    const label = resolved.revertReason || 'unknown';
    const summary = `Call reverted: ${label}`;
    return new ContractRevertError(summary, revertData, resolved.revertReason, null, null, extra);
  }

  const actionPart = action ? ` (${action})` : '';
  const detail = nestedRpc && nestedRpc !== message ? `${message}: ${nestedRpc}` : message;
  return new NetworkError(
    `RPC call failed${actionPart} during ${methodName}: ${detail}`,
    rpcUrl,
    error
  );
}
