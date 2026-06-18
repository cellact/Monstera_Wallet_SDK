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

/** @type {readonly BuiltinAuthenticatorSpec[]} */
export const BUILTIN_AUTHENTICATORS = [
  passwordAuthenticator,
  passwordMinuteSignatureAuthenticator,
  walletSignatureAuthenticator,
  dualFactorAuthenticator
];

/** @typedef {'password' | 'minuteSignature' | 'walletSignature' | 'dualFactor'} AuthProofFlowId */

/** @type {Map<string, BuiltinAuthenticatorSpec>} */
const byFlowId = new Map(BUILTIN_AUTHENTICATORS.map((spec) => [spec.flowId, spec]));

/**
 * @public
 * @param {ContractAddresses} addresses
 */
export function createBuiltinAuthenticatorRegistry(addresses) {
  const proofByAddr = createRegistryByChecksumAddress(
    BUILTIN_AUTHENTICATORS.map((spec) => ({
      address: addresses[spec.addressKey],
      encoder: spec.proofEncoder
    }))
  );

  const configByAddr = createRegistryByChecksumAddress(
    BUILTIN_AUTHENTICATORS.map((spec) => ({
      address: addresses[spec.addressKey],
      encoder: spec.configEncoder
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
  passwordAuthenticator,
  passwordMinuteSignatureAuthenticator,
  walletSignatureAuthenticator,
  dualFactorAuthenticator
};
