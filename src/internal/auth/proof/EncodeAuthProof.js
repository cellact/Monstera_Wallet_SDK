/**
 * Builder for the {@code authProof} bytes consumed by every authenticated KeyVault entry point.
 *
 * @description Each call to {@link encode} resolves the wallet's currently configured
 * authenticator address (via the network-aware {@code ctx.getAuthenticatorAddr} hook), looks up
 * the matching proof encoder strategy, and produces the bytes the contract expects. Unlike the
 * create-wallet config builder, proof encoding can be async (e.g. it may need to sign EIP-712
 * data) — hence the {@link Promise} return.
 *
 * @typedef {import('../../../types/index.js').EncodeAuthProofInputOptions} EncodeAuthProofInputOptions
 * @typedef {import('../../../types/index.js').EncodeAuthProofOptionsResult} EncodeAuthProofOptionsResult
 * @typedef {import('../../../types/index.js').AuthProofInputOptions} AuthProofInputOptions
 * @typedef {import('../../../types/index.js').AuthProofContext} AuthProofContext
 *
 * @module internal/auth/proof/EncodeAuthProof
 */

import { requireAddress } from '../../assert.js';
import { ValidationError } from '../../../errors/index.js';
import log from '../../logger.js';
import { createAuthProofEncoderRegistry } from './registry.js';

/**
 * Auth-proof encoder façade owned by the {@code Monstera} instance.
 *
 * @public
 */
export class EncodeAuthProof {
  /**
   * @public
   * @param {AuthProofContext} ctx - Resolved network context (addresses + per-call helpers like
   *   {@code getAuthenticatorAddr})
   */
  constructor(ctx) {
    this._ctx = ctx;
    this._registry = createAuthProofEncoderRegistry(ctx.addresses);
  }

  /**
   * Encode public KeyVault call options into the shape consumed by {@code KeyVaultClient}.
   *
   * @description Three paths:
   * 1. {@code options.authProof} is missing, a hex string, or a {@code Uint8Array} → returned
   *    as-is (advanced consumers can pre-encode their own bytes)
   * 2. {@code options.authProof} is a structured object → resolves the wallet's authenticator
   *    address, finds the encoder, and replaces {@code authProof} with the encoded bytes
   * 3. Anything else → {@link ValidationError}
   *
   * @public
   * @async
   * @param {EncodeAuthProofInputOptions} options - Public KeyVault call options
   * @returns {Promise<EncodeAuthProofOptionsResult>} Options with {@code authProof} as encoded bytes
   * @throws {ValidationError} If {@code authProof} is neither a string / {@code Uint8Array} nor a
   *   plain object, if {@code keyVaultAddr} fails address validation (raised by
   *   {@link requireAddress}), or if the resolved authenticator is not a built-in Monstera
   *   authenticator (advanced consumers should pre-encode their bytes instead)
   * @throws {WalletError} Forwards any error thrown by {@code ctx.getAuthenticatorAddr} (e.g.
   *   {@link ContractRevertError} / {@link NetworkError} from a failed read)
   * @throws {WalletError} Forwards any encoder-specific error (e.g. signing failures translated
   *   via {@code signingTranslator})
   */
  async encode(options) {
    const { authProof, keyVaultAddr, ...rest } = options;

    if (!authProof || typeof authProof === 'string' || authProof instanceof Uint8Array) {
      return options;
    }

    if (typeof authProof !== 'object' || Array.isArray(authProof)) {
      throw new ValidationError(
        'authProof must be a hex string, Uint8Array, or a plain object for built-in authenticators',
        'authProof',
        authProof
      );
    }

    requireAddress(keyVaultAddr, 'keyVaultAddr');
    const authenticatorAddr = await this._ctx.getAuthenticatorAddr(keyVaultAddr);
    const encoder = this._registry.getByAuthenticatorAddr(authenticatorAddr);

    if (!encoder) {
      throw new ValidationError(
        'No built-in encoder for this authenticator; pass authProof as hex bytes',
        'authenticatorAddr',
        authenticatorAddr
      );
    }

    log.info('encoding auth proof', { encoderId: encoder.id, keyVaultAddr });

    const encodeCtx = { ...this._ctx, authenticatorAddr, keyVaultAddr };
    const bytes = await encoder.encode(encodeCtx, /** @type {AuthProofInputOptions} */ (authProof));
    return { ...rest, keyVaultAddr, authProof: bytes };
  }
}
