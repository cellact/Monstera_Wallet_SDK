/**
 * Revert decoding helpers and CALL_EXCEPTION / UNPREDICTABLE_GAS_LIMIT translation.
 *
 * @typedef {import('../../types/index.js').EthersInterface} EthersInterface
 * @typedef {import('../../types/index.js').TransactionReceipt} TransactionReceipt
 */

import {
  WalletError,
  NetworkError,
  ContractRevertError
} from '../WalletError.js';

/**
 * Revert payload from ethers CALL_EXCEPTION or nested JSON-RPC error.
 *
 * @param {unknown} err
 * @returns {string | null}
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
 * Decode custom Solidity error bytes using the contract ABI (ethers v6 {@code Interface.parseError}).
 *
 * @param {EthersInterface | null} iface
 * @param {string} data
 * @returns {{ revertReason: string | null, revertArgs: unknown, revertSignature: string | null }}
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
 * @param {Error} err
 * @returns {string | null}
 */
function nestedRpcMessage(err) {
  const info = /** @type {{ error?: { message?: string } }} */ (err).info;
  const nested = info?.error?.message;
  return typeof nested === 'string' && nested.length > 0 ? nested : null;
}

/**
 * @param {Record<string, unknown>} extra
 * @param {{ revertArgs?: unknown, revertSignature?: string | null }} source
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
 * @param {EthersInterface | null | undefined} iface
 * @param {string | null} revertData
 * @param {string | null} revertReason
 * @param {unknown} revertArgsExisting
 * @param {Error & { reason?: string; revert?: { name?: string } }} err
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
 * @param {Error} err
 * @param {EthersInterface|null} revertInterface
 * @param {string|null|undefined} enrichRevertData
 * @param {string|null|undefined} enrichRevertReason
 * @param {unknown} enrichRevertArgs
 * @param {string|null|undefined} enrichRevertSignature
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
 * @typedef {import('../pipeline.js').ErrorTranslationContext} ErrorTranslationContext
 */

/**
 * @param {unknown} err
 * @param {ErrorTranslationContext} context
 * @returns {WalletError | null}
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
