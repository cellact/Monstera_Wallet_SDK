/**
 * Address → authProof encoder lookup (delegates to built-in authenticator registry).
 *
 * @typedef {import('../../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../../../types/index.js').AuthProofEncoderRegistry} AuthProofEncoderRegistry
 *
 * @module internal/auth/proof/registry
 */

import { createBuiltinAuthenticatorRegistry } from '../authenticators/registry.js';

/**
 * @public
 * @param {ContractAddresses} addresses
 * @returns {AuthProofEncoderRegistry}
 */
export function createAuthProofEncoderRegistry(addresses) {
  const registry = createBuiltinAuthenticatorRegistry(addresses);
  return {
    getByAuthenticatorAddr: registry.getProofEncoderByAuthenticatorAddr
  };
}
