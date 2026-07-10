/**
 * Normalize caller options into structured auth-proof input for a built-in authenticator.
 *
 * @module internal/auth/authenticators/collectProofInput
 */

import { keccak256 } from '../../../adapters/ethers/hashing.js';
import { isPlainObject } from '../../assert.js';

/**
 * Resolve password hash from explicit hash, UTF-8 password bytes, or top-level options.
 *
 * @param {Record<string, unknown>} partial
 * @param {Record<string, unknown>} options
 * @returns {Bytes32 | undefined}
 */
function resolvePasswordHash(partial, options) {
  if (partial.passwordHash != null) {
    return /** @type {Bytes32} */ (partial.passwordHash);
  }
  if (partial.password != null) {
    return keccak256(/** @type {Uint8Array} */ (partial.password));
  }
  if (options.passwordHash != null) {
    return /** @type {Bytes32} */ (options.passwordHash);
  }
  if (options.password != null) {
    return keccak256(/** @type {Uint8Array} */ (options.password));
  }
  return undefined;
}

/**
 * @public
 * @param {{ flowId: string }} spec
 * @param {Record<string, unknown>} options
 * @returns {Record<string, unknown>}
 */
export function collectProofInput(spec, options) {
  const partial = isPlainObject(options.authProof) ? options.authProof : {};

  switch (spec.flowId) {
    case 'password':
      return { ...partial, password: partial.password ?? options.password };
    case 'minuteSignature':
      return { ...partial, passwordHash: resolvePasswordHash(partial, options) };
    case 'walletSignature':
      return {
        ...partial,
        signer: partial.signer ?? options.signer,
        deadline: partial.deadline ?? options.deadline
      };
    case 'dualFactor':
      return {
        ...partial,
        passwordHash: resolvePasswordHash(partial, options),
        signer: partial.signer ?? options.signer,
        deadline: partial.deadline ?? options.deadline
      };
    case 'apiKeySession':
      return {
        ...partial,
        apiKeySecret: partial.apiKeySecret ?? options.apiKeySecret,
        mode: partial.mode ?? options.mode,
        expiry: partial.expiry ?? options.expiry,
        scopeMask: partial.scopeMask ?? options.scopeMask
      };
    case 'multi':
      return {
        ...partial,
        viaChild: partial.viaChild ?? options.viaChild,
        child: partial.child ?? options.child,
        childFlowId: partial.childFlowId ?? options.childFlowId,
        viaChildFlowId: partial.viaChildFlowId ?? options.viaChildFlowId,
        apiKeySecret: partial.apiKeySecret ?? options.apiKeySecret,
        mode: partial.mode ?? options.mode,
        expiry: partial.expiry ?? options.expiry,
        scopeMask: partial.scopeMask ?? options.scopeMask,
        password: partial.password ?? options.password,
        passwordHash: partial.passwordHash ?? options.passwordHash,
        signer: partial.signer ?? options.signer,
        deadline: partial.deadline ?? options.deadline
      };
    case 'passwordOrWalletSignature':
      return {
        ...partial,
        method: partial.method ?? options.method,
        password: partial.password ?? options.password ?? options.currentPassword,
        signer: partial.signer ?? options.signer,
        deadline: partial.deadline ?? options.deadline
      };
    default:
      return { ...partial };
  }
}
