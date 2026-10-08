/**
 * Sapphire-aware provider / signer construction.
 *
 * The SDK runs on Oasis Sapphire, where every state-changing transaction must be encrypted via
 * {@code wrapEthersSigner} from {@code @oasisprotocol/sapphire-ethers-v6}. This module is the
 * single boundary through which write signers are built: it normalises the user-supplied signer
 * (private key string or {@link EthersSigner} instance), wraps it for confidential calls, and
 * surfaces a uniform {@link SapphireRequiredError} when wrapping fails (e.g. missing peer
 * dependency).
 *
 * Read-only providers do not need to be wrapped and are constructed via the shared
 * {@link createProvider} re-export.
 *
 *
 * @module providers/sapphire
 */

import { SapphireRequiredError, ValidationError } from '../errors/index.js';
import { Wallet } from '../adapters/ethers/index.js';
import { createProvider } from '../adapters/ethers/provider.js';
import { requireConfigString } from '../internal/validators/configAssert.js';
import { wrapEthersSigner } from '@oasisprotocol/sapphire-ethers-v6';
import log from '../internal/logger.js';

/**
 * Wrap an ethers signer with the Sapphire confidential transaction wrapper.
 *
 * @description Delegates to {@code wrapEthersSigner}; any failure (typically a missing peer
 * dependency or unsupported signer shape) is logged at {@code warn} level and rethrown as a
 * {@link SapphireRequiredError} so callers see one canonical error type for "Sapphire is not
 * available".
 *
 * @public
 * @param {EthersSigner} signer - A standard ethers signer
 * @returns {WrappedEthersSigner} Sapphire-wrapped signer that encrypts transaction calldata
 * @throws {SapphireRequiredError} If {@code wrapEthersSigner} throws (typically because
 *   {@code @oasisprotocol/sapphire-ethers-v6} is not installed or the input is not a usable signer)
 */
function wrapSigner(signer) {
  try {
    return wrapEthersSigner(signer);
  } catch (error) {
    log.warn('Failed to wrap signer with Sapphire', { error: error?.message });
    throw new SapphireRequiredError(
      `Failed to wrap signer with Sapphire: ${error.message}. ` +
      `Make sure @oasisprotocol/sapphire-ethers-v6 is installed.`
    );
  }
}

/**
 * Build the Sapphire-wrapped signer used for every write call in the SDK.
 *
 * @description Accepts either a private-key hex string or an existing ethers {@link EthersSigner}
 * instance, normalises it into a {@code Wallet}-compatible signer (constructing one against
 * {@code rpcUrl} when given a key), and finally wraps it via {@link wrapSigner}. The
 * {@code role} label is forwarded to the underlying provider only as a log hint.
 *
 * @remarks Detection of "is this a signer?" is duck-typed on the presence of {@code signMessage};
 * any other input shape is rejected with {@link ValidationError}. An invalid private-key string
 * is also a {@link ValidationError}. The key is not copied into the message or the context.
 *
 * @public
 * @param {string | EthersSigner} providedSigner - Private-key hex string, or an ethers signer
 * @param {string} [rpcUrl] - JSON-RPC URL used only when {@code providedSigner} is a private key
 * @param {string} [role] - Optional log label (defaults to {@code "write"})
 * @returns {WrappedEthersSigner} Sapphire-wrapped signer ready for encrypted writes
 * @throws {ConfigError} If a private-key string is provided without {@code rpcUrl}
 * @throws {ValidationError} If {@code providedSigner} is neither a string nor a signer-shaped
 *   object exposing {@code signMessage}, or if a string is not a usable private key
 * @throws {SapphireRequiredError} If Sapphire wrapping fails (see {@link wrapSigner})
 */
function createWriteSigner(providedSigner, rpcUrl, role) {
  let signer;
  
  if (typeof providedSigner === 'string') {
    requireConfigString(
      rpcUrl,
      'rpcUrl',
      'RPC URL is required when providing private key as string'
    );
    const provider = createProvider(rpcUrl, role);
    try {
      signer = new Wallet(providedSigner, provider);
    } catch {
      throw new ValidationError(
        'Invalid private key.',
        'providedSigner',
        providedSigner
      );
    }
  } 
  else if (providedSigner && typeof providedSigner.signMessage === 'function') {
    signer = providedSigner;
  }
  else {
    throw new ValidationError(
      'Invalid signer. Must be a private key string, or a Signer instance.',
      'providedSigner',
      providedSigner
    );
  }

  log.debug('createWriteSigner', { role: role ?? 'write' });

  return wrapSigner(signer);
}

export {
  createProvider,
  wrapSigner,
  createWriteSigner,
};
