/**
 * Resolve structured {@code authProof} objects to bytes for KeyVault authenticated calls
 * using the on-chain authenticator for {@code keyVaultAddr}.
 *
 * @typedef {import('../../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 * @typedef {import('../../../types/index.js').EncodeAuthProofOptionsInput} EncodeAuthProofOptionsInput
 * @typedef {import('../../../types/index.js').EncodeAuthProofOptionsResult} EncodeAuthProofOptionsResult
 *
 * @typedef {Object} KeyVaultAuthProofPrepareContext
 * @property {ContractAddresses} addresses
 * @property {string|number} chainId
 * @property {EthersAbstractProvider} readProvider
 * @property {(keyVaultAddr: Address) => Promise<Address>} getAuthenticatorAddr
 *
 * @typedef {Object} KeyVaultAuthProofEncodeContext
 * @property {ContractAddresses} addresses
 * @property {string|number} chainId
 * @property {EthersAbstractProvider} readProvider
 * @property {Address} authenticatorAddr
 * @property {Address} keyVaultAddr
 */

import { requireAddress } from '../../assert.js';
import { ValidationError } from '../../../errors/index.js';
import log from '../../logger.js';
import { createKeyVaultAuthProofEncoderRegistry } from './registry.js';

/**
 * @param {KeyVaultAuthProofPrepareContext} ctx
 * @param {EncodeAuthProofOptionsInput} options - KeyVault call options (must include {@code keyVaultAddr} when {@code authProof} is a structured object)
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
  const registry = createKeyVaultAuthProofEncoderRegistry(ctx.addresses);
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

  const bytes = await encoder.encode(encodeCtx, /** @type {Record<string, unknown>} */ (authInput));

  return { ...rest, authProof: bytes };
}
