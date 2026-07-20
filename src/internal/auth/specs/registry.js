/**
 * Built-in authenticator registry (address, flow id, and encoder lookups).
 *
 * @module internal/auth/specs/registry
 */

import { toChecksumAddress } from '../../crypto/address.js';
import { passwordAuthenticator } from './password.js';
import { passwordMinuteSignatureAuthenticator } from './passwordMinuteSignature.js';
import { walletSignatureAuthenticator } from './walletSignature.js';
import { dualFactorAuthenticator } from './dualFactor.js';
import { apiKeySessionAuthenticator } from './apiKeySession.js';
import { multiAuthenticator, createMultiConfigEncoder } from './multi.js';
import { passwordOrWalletSignatureAuthenticator } from './passwordOrWalletSignature.js';

/**
 * Build a checksum-keyed encoder registry.
 *
 * @description Normalises every input address to its EIP-55 checksum form via
 * {@link toChecksumAddress} before storing or looking up entries.
 *
 * @template T
 * @param {Array<{ address: Address, encoder: T }>} entries - Address / encoder pairs to register
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: Address) => T | undefined }}
 */
export function createRegistryByChecksumAddress(entries) {
  /** @type {Map<string, T>} */
  const byChecksum = new Map();

  for (const { address, encoder } of entries) {
    const key = toChecksumAddress(address);
    byChecksum.set(key, encoder);
  }

  return {
    getByAuthenticatorAddr(authenticatorAddr) {
      const key = toChecksumAddress(authenticatorAddr);
      return byChecksum.get(key);
    }
  };
}

/** @type {readonly BuiltinAuthenticatorSpec[]} */
export const CHILD_AUTHENTICATORS = [
  apiKeySessionAuthenticator,
  passwordAuthenticator,
  passwordMinuteSignatureAuthenticator,
  walletSignatureAuthenticator,
  dualFactorAuthenticator,
  passwordOrWalletSignatureAuthenticator,
];

/** @type {readonly BuiltinAuthenticatorSpec[]} */
export const BUILTIN_AUTHENTICATORS = [
  ...CHILD_AUTHENTICATORS,
  multiAuthenticator
];

/** @type {Map<string, BuiltinAuthenticatorSpec>} */
const byFlowId = new Map(BUILTIN_AUTHENTICATORS.map((spec) => [spec.flowId, spec]));

/**
 * @param {ContractAddresses} addresses
 * @returns {{ getByAuthenticatorAddr: (authenticatorAddr: Address) => CreateWalletAuthEncoder | undefined }}
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
  const multiConfigEncoder = createMultiConfigEncoder(childConfigRegistry);

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
