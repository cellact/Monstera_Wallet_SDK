/**
 * Map public create-wallet options to the shape expected by {@link WalletFactoryClient}:
 * structured {@code authConfig} objects are encoded via the built-in authenticator registry;
 * hex strings pass through for custom authenticators.
 *
 * @typedef {import('../../../types/index.js').ContractAddresses} ContractAddresses
 *
 * @typedef {Object} CreateWalletAuthConfigPrepareContext
 * @property {ContractAddresses} addresses
 */

import log from '../../logger.js';
import { requireAddress } from '../../assert.js';
import { ValidationError } from '../../../errors/index.js';
import { createCreateWalletAuthEncoderRegistry } from './registry.js';

/**
 * @param {CreateWalletAuthConfigPrepareContext} ctx
 * @param {Record<string, unknown>} options
 * @returns {Record<string, unknown>}
 */
export function encodeAuthConfigOptions(ctx, options) {
  const { authConfig: authInput, ...rest } = options;

  if (authInput === undefined || authInput === null) {
    throw new ValidationError('authConfig is required', 'authConfig', authInput);
  }

  if (typeof authInput === 'string') {
    return { ...options };
  }

  if (typeof authInput !== 'object' || Array.isArray(authInput)) {
    throw new ValidationError(
      'authConfig must be a hex-encoded bytes string or a plain object with per-authenticator fields',
      'authConfig',
      authInput
    );
  }

  const authenticatorAddr =
    options.authenticatorAddr ?? ctx.addresses.passwordAuth;
  requireAddress(authenticatorAddr, 'authenticatorAddr');

  const registry = createCreateWalletAuthEncoderRegistry(ctx.addresses);
  const encoder = registry.getByAuthenticatorAddr(authenticatorAddr);

  if (!encoder) {
    throw new ValidationError(
      'authenticatorAddr is not a built-in Monstera authenticator; pass authConfig as a hex-encoded bytes string instead',
      'authenticatorAddr',
      authenticatorAddr
    );
  }

  log.info('encoding auth config', { encoderId: encoder.id });
  const encoded = encoder.encode(authInput);

  return {
    ...rest,
    authenticatorAddr,
    authConfig: encoded
  };
}
