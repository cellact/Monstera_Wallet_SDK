/**
 * Builder for the {@code authConfig} bytes consumed by every {@code WalletFactory.createWallet*}
 * entry point.
 *
 * @description Holds an encoder registry built from the network's authenticator addresses (so the
 * builder can look up the right encoder by address) and exposes a single {@link encode} method
 * that:
 * - accepts already-encoded hex-string {@code authConfig} unchanged (advanced path)
 * - encodes structured per-authenticator objects via the registered encoder
 * - resolves the authenticator address from the caller's options or the default
 *   {@code passwordAuth} preset
 *
 * Used by {@code Monstera.createWallet*} before forwarding to {@code WalletFactoryClient}.
 *
 * @typedef {import('../../../types/index.js').EncodeAuthConfigInputOptions} EncodeAuthConfigInputOptions
 * @typedef {import('../../../types/index.js').EncodeAuthConfigOptionsResult} EncodeAuthConfigOptionsResult
 * @typedef {import('../../../types/index.js').AuthConfigContext} AuthConfigContext
 *
 * @module internal/auth/config/AuthConfigBuilder
 */

import log from '../../logger.js';
import { requireAddress } from '../../assert.js';
import { ValidationError } from '../../../errors/index.js';
import { createCreateWalletAuthEncoderRegistry } from './registry.js';

/**
 * Auth-config encoder façade owned by the {@code Monstera} instance.
 *
 * @public
 */
export class AuthConfigBuilder {
  /**
   * @public
   * @param {AuthConfigContext} ctx - Resolved network context (chain id, addresses) used to build
   *   the address-keyed encoder registry
   */
  constructor(ctx) {
    this._ctx = ctx;
    this._registry = createCreateWalletAuthEncoderRegistry(ctx.addresses);
  }

  /**
   * Encode public create-wallet options into the shape consumed by {@code WalletFactoryClient}.
   *
   * @description Three paths:
   * 1. {@code options.authConfig} is a hex string → returned as-is (advanced consumers can
   *    pre-encode their own bytes)
   * 2. {@code options.authConfig} is a structured object → resolves the authenticator address,
   *    looks up the matching encoder, and replaces {@code authConfig} with the encoded bytes
   * 3. Anything else → {@link ValidationError}
   *
   * @public
   * @param {EncodeAuthConfigInputOptions} options - Public create-wallet options
   * @returns {EncodeAuthConfigOptionsResult} Options with {@code authConfig} as encoded bytes and
   *   {@code authenticatorAddr} resolved
   * @throws {ValidationError} If {@code options.authConfig} is missing, not a string and not a
   *   plain object, or if {@code authenticatorAddr} is not one of the Monstera built-in
   *   authenticators (use the hex-string path for custom authenticators)
   * @throws {ValidationError} If the resolved {@code authenticatorAddr} fails address validation
   *   (raised by {@link requireAddress})
   * @throws {ValidationError} If the resolved encoder rejects the structured input (per-encoder
   *   validation rules — see {@code internal/auth/config/encoders/*})
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
