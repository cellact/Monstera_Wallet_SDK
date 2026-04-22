/**
 * Resolve structured {@code authProof} objects to bytes for KeyVault authenticated calls
 * using the on-chain authenticator for {@code keyVaultAddr}.
 *
 * @typedef {import('../../../types/index.js').AuthProofContext} AuthProofContext
 * @typedef {import('../../../types/index.js').EncodeAuthProofInputOptions} EncodeAuthProofInputOptions
 * @typedef {import('../../../types/index.js').EncodeAuthProofOptionsResult} EncodeAuthProofOptionsResult
 * @typedef {import('../../../types/index.js').AuthProofInputOptions} AuthProofInputOptions
 */

import { requireAddress } from '../../assert.js';
import { ValidationError } from '../../../errors/index.js';
import log from '../../logger.js';
import { createAuthProofEncoderRegistry } from './registry.js';

/**
 * @param {AuthProofContext} ctx
 * @param {EncodeAuthProofInputOptions} options - KeyVault call options (must include {@code keyVaultAddr} when {@code authProof} is a structured object)
 * @returns {Promise<EncodeAuthProofOptionsResult>}
 */
export async function encodeAuthProofOptions(ctx, options) {
  const { authProof: authInput, ...rest } = options;

  if (authInput === undefined || authInput === null) {
    throw new ValidationError('authProof is required', 'authProof', authInput);
  }

  if (typeof authInput === 'string' || authInput instanceof Uint8Array) {
    return { ...rest, authProof: authInput };
  }

  if (typeof authInput !== 'object' || Array.isArray(authInput)) {
    throw new ValidationError(
      'authProof must be a hex string, Uint8Array, or a plain object for built-in authenticators',
      'authProof',
      authInput
    );
  }

  const { keyVaultAddr } = rest;
  requireAddress(keyVaultAddr, 'keyVaultAddr');

  const authenticatorAddr = await ctx.getAuthenticatorAddr(keyVaultAddr);
  const registry = createAuthProofEncoderRegistry(ctx.addresses);
  const encoder = registry.getByAuthenticatorAddr(authenticatorAddr);

  if (!encoder) {
    throw new ValidationError(
      'No built-in authProof encoder for this authenticator; pass authProof as hex bytes or Uint8Array',
      'authenticatorAddr',
      authenticatorAddr
    );
  }

  log.info('encoding auth proof', { encoderId: encoder.id, keyVaultAddr });

  const encodeCtx = {
    addresses: ctx.addresses,
    chainId: ctx.chainId,
    readProvider: ctx.readProvider,
    authenticatorAddr,
    keyVaultAddr
  };

  const bytes = await encoder.encode(encodeCtx, /** @type {AuthProofInputOptions} */ (authInput));

  return { ...rest, authProof: bytes };
}
