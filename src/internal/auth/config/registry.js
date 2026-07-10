/**
 * Address → encoder lookup for create-wallet auth configs.
 *
 * @module internal/auth/config/registry
 */

import { createBuiltinAuthenticatorRegistry } from '../authenticators/registry.js';

/**
 * @public
 * @param {ContractAddresses} addresses
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: Address) => CreateWalletAuthEncoder | undefined }}
 */
export function createCreateWalletAuthEncoderRegistry(addresses) {
  const registry = createBuiltinAuthenticatorRegistry(addresses);
  return {
    getByAuthenticatorAddr: registry.getConfigEncoderByAuthenticatorAddr
  };
}
