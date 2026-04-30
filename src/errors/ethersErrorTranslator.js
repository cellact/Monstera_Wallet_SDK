/**
 * Central ethers → SDK error translation.
 *
 * Maps ethers v6 errors (CALL_EXCEPTION, network codes, etc.) to WalletError subclasses
 * with consistent messages and merged {@code sdkContext} (method params, client name, …).
 */

import {
  WalletError,
  NetworkError,
  ContractRevertError
} from './WalletError.js';
import {
  sanitizeEncoderErrorValue,
  sanitizeErrorContextShallow
} from '../internal/sensitiveParams.js';

/**
 * Merge SDK debugging context onto an existing WalletError (mutates {@code err.context}).
 *
 * @param {import('./WalletError.js').WalletError} err
 * @param {Record<string, unknown>} [sdkContext={}]
 */
export function applySdkContext(err, sdkContext = {}) {
  if (!(err instanceof WalletError) || !sdkContext || typeof sdkContext !== 'object') {
    return;
  }
  err.context = { ...(err.context || {}), ...sdkContext };
}

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
 * @param {import('ethers').Interface | null} iface
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
 * Resolve revert reason, args, and full error signature from error + optional interface.
 * Decodes ABI whenever {@code revertData} and {@code iface} are present so args are not
 * dropped when ethers already populated {@code err.revert.name}.
 *
 * @param {import('ethers').Interface | null | undefined} iface
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
 * @typedef {Object} ToWalletErrorInput
 * @property {string} methodName
 * @property {string|null} [rpcUrl]
 * @property {import('ethers').Interface|null} [revertInterface]
 * @property {Record<string, unknown>} [sdkContext] - Safe fields from {@link BaseContractClient.buildErrorContext}
 * @property {import('ethers').TransactionReceipt|null|undefined} [receipt]
 * @property {string|null} [transactionHash]
 * @property {string|null} [revertData]
 * @property {string|null} [revertReason]
 * @property {unknown} [revertArgs]
 * @property {string|null} [revertSignature] - Full Solidity error signature when known (e.g. from enrich or parse)
 */

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
 * Shared revert resolution for {@code CALL_EXCEPTION} / {@code UNPREDICTABLE_GAS_LIMIT} (mined vs static call paths).
 *
 * @param {Error} err
 * @param {import('ethers').Interface|null} revertInterface
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
 * Convert an ethers or RPC error into a {@link WalletError} subclass and merge {@code sdkContext}.
 *
 * @param {Error} err
 * @param {ToWalletErrorInput} options
 * @returns {import('./WalletError.js').WalletError}
 */
export function toWalletError(err, options = {}) {
  const {
    methodName,
    rpcUrl = null,
    revertInterface = null,
    sdkContext = {},
    receipt: receiptOpt,
    transactionHash: txHashOpt,
    revertData: enrichRevertData,
    revertReason: enrichRevertReason,
    revertArgs: enrichRevertArgs,
    revertSignature: enrichRevertSignature = null
  } = options;

  const message = err.message || String(err);
  const errorCode = /** @type {Error & { code?: string }} */ (err).code || /** @type {any} */ (err).error?.code;
  /** @type {string | undefined} */
  const action = typeof /** @type {any} */ (err).action === 'string' ? /** @type {any} */ (err).action : undefined;
  const nestedRpc = nestedRpcMessage(err);

  const finish = (/** @type {import('./WalletError.js').WalletError} */ walletErr) => {
    applySdkContext(walletErr, sdkContext);
    return walletErr;
  };

  if (errorCode === 'CALL_EXCEPTION' || errorCode === 'UNPREDICTABLE_GAS_LIMIT') {
    const receipt = /** @type {import('ethers').TransactionReceipt | null | undefined} */ (
      receiptOpt ?? /** @type {any} */ (err).receipt
    );
    const txHash =
      (typeof txHashOpt === 'string' && txHashOpt && txHashOpt.length > 0 ? txHashOpt : null) ||
      (receipt && typeof receipt.hash === 'string' ? receipt.hash : null);

    if (txHash && receipt) {
      const { revertData, resolved, extra } = buildCallExceptionRevertDetails(
        err,
        revertInterface,
        enrichRevertData,
        enrichRevertReason,
        enrichRevertArgs,
        enrichRevertSignature
      );
      const summary = resolved.revertReason
        ? `Transaction reverted: ${resolved.revertReason}`
        : `Transaction reverted: ${message}`;
      return finish(
        new ContractRevertError(
          summary,
          revertData,
          resolved.revertReason,
          txHash,
          receipt,
          extra
        )
      );
    }

    const { revertData, resolved, extra } = buildCallExceptionRevertDetails(
      err,
      revertInterface,
      enrichRevertData,
      enrichRevertReason,
      enrichRevertArgs,
      enrichRevertSignature
    );
    const hasRevert = !!(revertData || resolved.revertReason || /** @type {any} */ (err).revert);
    if (hasRevert) {
      const label = resolved.revertReason || 'unknown';
      const summary = `Call reverted: ${label}`;
      return finish(
        new ContractRevertError(
          summary,
          revertData,
          resolved.revertReason,
          null,
          null,
          extra
        )
      );
    }

    const actionPart = action ? ` (${action})` : '';
    const detail = nestedRpc && nestedRpc !== message ? `${message}: ${nestedRpc}` : message;
    return finish(
      new NetworkError(
        `RPC call failed${actionPart} during ${methodName}: ${detail}`,
        rpcUrl,
        err
      )
    );
  }

  if (errorCode === 'NETWORK_ERROR' || errorCode === 'TIMEOUT' || errorCode === 'SERVER_ERROR' ||
      errorCode === 'UNKNOWN_ERROR' || err.name === 'NetworkError') {
    return finish(
      new NetworkError(
        `Network error: ${message} during ${methodName}`,
        rpcUrl,
        err
      )
    );
  }

  if (errorCode === 'MISSING_ARGUMENT' || errorCode === 'INVALID_ARGUMENT') {
    const e = /** @type {Error & { count?: number; expectedCount?: number; argument?: string; value?: unknown }} */ (err);
    const argLabel = e.argument != null ? String(e.argument) : '';
    return finish(
      new WalletError(
        `ABI encoding failed during ${methodName}: ${message}`,
        'ABI_ENCODER_ERROR',
        {
          methodName,
          originalError: message,
          originalCode: errorCode,
          ...(e.count != null ? { argumentCount: e.count } : {}),
          ...(e.expectedCount != null ? { expectedArgumentCount: e.expectedCount } : {}),
          ...(e.argument != null ? { argument: e.argument } : {}),
          ...(e.value !== undefined ? { value: sanitizeEncoderErrorValue(argLabel, e.value) } : {})
        }
      )
    );
  }

  const safeSdk = sanitizeErrorContextShallow({ ...sdkContext });
  delete /** @type {any} */ (safeSdk).revertInterface;

  return new WalletError(
    `Failed during ${methodName}: ${message}`,
    'UNKNOWN_ERROR',
    { methodName, ...safeSdk, originalError: message, originalCode: errorCode }
  );
}

/**
 * Shared handler for {@code executeRead} / {@code executeWrite}: merges {@code sdkContext} into
 * an existing WalletError, otherwise delegates to {@code toWalletError}.
 *
 * @param {unknown} err
 * @param {{ methodName: string; rpcUrl: string|null; revertInterface?: import('ethers').Interface|null|undefined; sdkContext: Record<string, unknown> }} opts
 * @returns {never}
 */
export function rethrowExecuteError(err, opts) {
  const { methodName, rpcUrl, revertInterface, sdkContext } = opts;
  if (err instanceof WalletError) {
    applySdkContext(err, sdkContext);
    throw err;
  }
  throw toWalletError(/** @type {Error} */ (err), {
    methodName,
    rpcUrl,
    revertInterface,
    sdkContext
  });
}
