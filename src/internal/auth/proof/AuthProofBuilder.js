/**
 * Builder: resolves KeyVault {@code authProof} encoding context once and encodes structured inputs via the proof registry.
 *
 * @typedef {import('../../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../../../types/index.js').ChainId} ChainId
 * @typedef {import('../../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../../types/index.js').EncodeAuthProofInputOptions} EncodeAuthProofInputOptions
 * @typedef {import('../../../types/index.js').EncodeAuthProofOptionsResult} EncodeAuthProofOptionsResult
 * @typedef {import('../../../types/index.js').AuthProofInputOptions} AuthProofInputOptions
 * @typedef {import('../../../types/index.js').Address} Address
 */

import { requireAddress } from '../../assert.js';
import { ValidationError } from '../../../errors/index.js';
import log from '../../logger.js';
import { createAuthProofEncoderRegistry } from './registry.js';

export class AuthProofBuilder {
  /**
   * @param {ContractAddresses} addresses
   * @param {ChainId} chainId
   * @param {EthersProvider | null | undefined} readProvider
   * @param {(keyVaultAddr: Address) => Promise<Address>} getAuthenticatorAddr
   */
  constructor(addresses, chainId, readProvider, getAuthenticatorAddr) {
    this._ctx = { addresses, chainId, readProvider, getAuthenticatorAddr };
    this._registry = createAuthProofEncoderRegistry(addresses);
  }

  /**
   * Resolves authenticator, finds encoder, runs it — replaces {@code encodeAuthProofOptions}.
   *
   * @param {EncodeAuthProofInputOptions} options
   * @returns {Promise<EncodeAuthProofOptionsResult>}
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
