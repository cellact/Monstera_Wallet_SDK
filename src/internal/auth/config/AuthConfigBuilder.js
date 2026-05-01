/**
 * Builder: holds create-wallet {@code authConfig} registry context and encodes structured inputs.
 *
 * @typedef {import('../../../types/index.js').EncodeAuthConfigInputOptions} EncodeAuthConfigInputOptions
 * @typedef {import('../../../types/index.js').EncodeAuthConfigOptionsResult} EncodeAuthConfigOptionsResult
 * @typedef {import('../../../types/index.js').AuthConfigContext} AuthConfigContext
 */

import log from '../../logger.js';
import { requireAddress } from '../../assert.js';
import { ValidationError } from '../../../errors/index.js';
import { createCreateWalletAuthEncoderRegistry } from './registry.js';

export class AuthConfigBuilder {
  /**
   * @param {AuthConfigContext} ctx
   */
  constructor(ctx) {
    this._ctx = ctx;
    this._registry = createCreateWalletAuthEncoderRegistry(ctx.addresses);
  }

  /**
   * Maps public create-wallet options to WalletFactoryClient shape — replaces {@code encodeAuthConfigOptions}.
   *
   * @param {EncodeAuthConfigInputOptions} options
   * @returns {EncodeAuthConfigOptionsResult}
   */
  encode(options) {
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
      options.authenticatorAddr ?? this._ctx.addresses.passwordAuth;
    requireAddress(authenticatorAddr, 'authenticatorAddr');

    const encoder = this._registry.getByAuthenticatorAddr(authenticatorAddr);

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
}
