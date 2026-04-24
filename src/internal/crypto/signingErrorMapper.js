/**
 * Map ethers/signer failures from EIP-712 or similar signing into SDK errors.
 * Shared by auth-proof builders in wallet.js.
 */

import { NetworkError, ValidationError, WalletError } from '../../errors/index.js';

/**
 * @typedef {Object} RethrowSignerErrorOpts
 * @property {string} authProofType - Short noun phrase for messages, e.g. {@code "wallet-signature auth proof"} or {@code "dual-factor auth proof"}.
 * @property {string} functionName - Caller name for {@link WalletError} context.
 * @property {Record<string, unknown>} [validationExtra] - Extra fields on {@link ValidationError} when encoding fails (e.g. {@code { deadline }}).
 */

/**
 * Classify a non-{@link WalletError} signing failure and throw the same {@link NetworkError}, {@link ValidationError},
 * or {@link WalletError} shapes as the legacy per-caller catch blocks.
 *
 * @param {unknown} error
 * @param {RethrowSignerErrorOpts} opts
 * @returns {never}
 */
export function rethrowMappedSignerError(error, opts) {
  const { authProofType, functionName, validationExtra = {} } = opts;

  if (error instanceof WalletError) {
    throw error;
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
    throw new NetworkError(
      `Failed to create ${authProofType}: Network error during signing - ${errorMessage}`,
      null,
      /** @type {Error|null} */ (/** @type {any} */ (error))
    );
  }

  if (errorMessage.includes('encode') || errorMessage.includes('ABI')) {
    throw new ValidationError(
      `Failed to encode ${authProofType}: ${errorMessage}`,
      'authProof',
      validationExtra
    );
  }

  throw new WalletError(`Failed to create ${authProofType}: ${errorMessage}`, 'UNKNOWN_ERROR', {
    function: functionName,
    originalError: errorMessage,
    originalCode: errorCode
  });
}
