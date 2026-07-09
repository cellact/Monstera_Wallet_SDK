/**
 * Built-in authenticator registry (address, flow id, and encoder lookups).
 *
 * @typedef {import('../../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('./types.js').BuiltinAuthenticatorSpec} BuiltinAuthenticatorSpec
 *
 * @module internal/auth/authenticators/registry
 */

import { createRegistryByChecksumAddress } from '../shared/registryByChecksumAddress.js';
import { passwordAuthenticator } from './password.js';
import { passwordMinuteSignatureAuthenticator } from './passwordMinuteSignature.js';
import { walletSignatureAuthenticator } from './walletSignature.js';
import { dualFactorAuthenticator } from './dualFactor.js';
import { apiKeySessionAuthenticator } from './apiKeySession.js';
import { multiAuthenticator, wrapMultiConfigEncoder } from './multi.js';
import { passwordOrWalletSignatureAuthenticator } from './passwordOrWalletSignature.js';

/** @type {readonly import('./types.js').BuiltinAuthenticatorSpec[]} */
const CHILD_AUTHENTICATORS = [
  apiKeySessionAuthenticator,
  passwordAuthenticator,
  passwordMinuteSignatureAuthenticator,
  walletSignatureAuthenticator,
  dualFactorAuthenticator,
  passwordOrWalletSignatureAuthenticator,
];

/** @type {readonly import('./types.js').BuiltinAuthenticatorSpec[]} */
export const BUILTIN_AUTHENTICATORS = [
  ...CHILD_AUTHENTICATORS,
  multiAuthenticator
];

/** @typedef {'apiKeySession' | 'password' | 'minuteSignature' | 'walletSignature' | 'dualFactor' | 'passwordOrWalletSignature' | 'multi'} AuthProofFlowId */

/** @type {Map<string, BuiltinAuthenticatorSpec>} */
const byFlowId = new Map(BUILTIN_AUTHENTICATORS.map((spec) => [spec.flowId, spec]));

/**
 * @param {ContractAddresses} addresses
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: Address) => import('../../../types/index.js').CreateWalletAuthEncoder | undefined }}
 */
function createChildConfigEncoderRegistry(addresses) {
  return createRegistryByChecksumAddress(
    CHILD_AUTHENTICATORS.map((spec) => ({
      address: addresses[spec.addressKey],
      encoder: spec.configEncoder
    }))
  );
}

/**
 * @public
 * @param {ContractAddresses} addresses
 */
export function createBuiltinAuthenticatorRegistry(addresses) {
  const childConfigRegistry = createChildConfigEncoderRegistry(addresses);
  const multiConfigEncoder = wrapMultiConfigEncoder(childConfigRegistry);

  const proofByAddr = createRegistryByChecksumAddress(
    BUILTIN_AUTHENTICATORS.map((spec) => ({
      address: addresses[spec.addressKey],
      encoder: spec.proofEncoder
    }))
  );

  const configByAddr = createRegistryByChecksumAddress(
    BUILTIN_AUTHENTICATORS.map((spec) => ({
      address: addresses[spec.addressKey],
      encoder: spec.flowId === 'multi' ? multiConfigEncoder : spec.configEncoder
    }))
  );

  return {
    /**
     * @param {Address} authenticatorAddr
     * @returns {BuiltinAuthenticatorSpec | undefined}
     */
    getSpecByAuthenticatorAddr(authenticatorAddr) {
      const encoder = proofByAddr.getByAuthenticatorAddr(authenticatorAddr);
      if (!encoder) {
        return undefined;
      }
      return BUILTIN_AUTHENTICATORS.find((spec) => spec.proofEncoder === encoder);
    },

    /**
     * @param {AuthProofFlowId} flowId
     * @returns {BuiltinAuthenticatorSpec | undefined}
     */
    getSpecByFlowId(flowId) {
      return byFlowId.get(flowId);
    },

    getProofEncoderByAuthenticatorAddr: proofByAddr.getByAuthenticatorAddr,
    getConfigEncoderByAuthenticatorAddr: configByAddr.getByAuthenticatorAddr
  };
}

// Re-export individual specs for callers that need direct access.
export {
  apiKeySessionAuthenticator,
  passwordAuthenticator,
  passwordMinuteSignatureAuthenticator,
  walletSignatureAuthenticator,
  dualFactorAuthenticator,
  passwordOrWalletSignatureAuthenticator,
  multiAuthenticator
};
