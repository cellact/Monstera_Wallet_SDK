/**
 * MultiAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/multi
 */

import { ValidationError } from '../../../errors/index.js';
import { requireAddress, requireArray, requireBytes } from '../../validation/assert.js';
import { createMultiAuthConfig } from '../config/bytes.js';
import { createActionBoundEncoder, pickAuthProofPartial } from '../proof/common.js';
import { encodeMultiChildProof } from '../proof/builders/multiChildEncode.js';
import { createAuthenticatorSpec } from './createAuthenticatorSpec.js';
import { resolveChildAddr, resolveChildSpec } from './multiChildResolver.js';

/**
 * @param {CreateWalletAuthEncoder} childRegistry
 * @returns {CreateWalletAuthEncoder}
 */
export function createMultiConfigEncoder(childRegistry) {
  return {
    id: 'multiAuthenticator',
    encode(authConfig) {
      if (
        authConfig.childConfigs != null &&
        Array.isArray(authConfig.children) &&
        authConfig.children.length > 0 &&
        typeof authConfig.children[0] === 'string'
      ) {
        return createMultiAuthConfig(
          /** @type {Address[]} */ (authConfig.children),
          /** @type {Bytes[]} */ (authConfig.childConfigs)
        );
      }

      requireArray(authConfig.children, 'children');
      /** @type {Address[]} */
      const children = [];
      /** @type {Bytes[]} */
      const childConfigs = [];

      for (const entry of authConfig.children) {
        requireAddress(entry.authenticatorAddr, 'children[].authenticatorAddr');
        const encoder = childRegistry.getByAuthenticatorAddr(entry.authenticatorAddr);
        if (!encoder) {
          throw new ValidationError(
            'children[].authenticatorAddr is not a built-in Monstera authenticator',
            'children[].authenticatorAddr',
            entry.authenticatorAddr
          );
        }
        children.push(entry.authenticatorAddr);
        childConfigs.push(encoder.encode(/** @type {AuthConfigInputOptions} */ (entry.authConfig)));
      }

      return createMultiAuthConfig(children, childConfigs);
    }
  };
}

/** @type {BuiltinAuthenticatorSpec} */
export const multiAuthenticator = createAuthenticatorSpec({
  id: 'multiAuthenticator',
  flowId: 'multi',
  addressKey: 'multiAuthenticator',
  includeAddresses: true,

  applySessionInput(session, partial) {
    const addresses = partial.addresses;
    const childFlowId = partial.childFlowId ?? partial.viaChildFlowId;
    if (addresses != null && childFlowId != null) {
      const childSpec = resolveChildSpec({ childFlowId }, addresses);
      return childSpec.applySessionInput(session, partial);
    }
    return partial;
  },

  collectProofInput(options) {
    const partial = pickAuthProofPartial(options);
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
  },

  mapSessionResolved(resolved, authenticatorAddr) {
    const base = { keyVaultAddr: resolved.keyVaultAddr, authenticatorAddr };
    const hasExplicitProofRoute =
      resolved.viaChild != null ||
      resolved.viaChildFlowId != null ||
      resolved.childFlowId != null;

    return {
      ...base,
      viaChild: resolved.viaChild,
      viaChildFlowId: resolved.viaChildFlowId,
      childFlowId: resolved.childFlowId,
      ...(hasExplicitProofRoute ? {} : { child: resolved.child }),
      apiKeySecret: resolved.apiKeySecret,
      password: resolved.currentPassword ?? resolved.password,
      passwordHash: resolved.passwordHash,
      signer: resolved.signer,
      deadline: resolved.deadline,
      mode: resolved.mode,
      expiry: resolved.expiry,
      scopeMask: resolved.scopeMask
    };
  },

  validatePrepareInput(options) {
    requireAddress(options.keyVaultAddr, 'keyVaultAddr');
    if (options.addresses == null) {
      throw new ValidationError(
        'addresses context is required to validate multi authenticator input',
        'addresses',
        options.addresses
      );
    }
    const hasProofRoute =
      options.viaChild != null ||
      options.viaChildFlowId != null ||
      options.childFlowId != null ||
      options.child != null;
    if (!hasProofRoute) {
      throw new ValidationError(
        'viaChildFlowId, childFlowId, viaChild, or child is required for multi authenticator proofs',
        'childFlowId',
        options.childFlowId
      );
    }
    const childSpec = resolveChildSpec(options, options.addresses);
    childSpec.validatePrepareInput({
      ...options,
      authenticatorAddr: resolveChildAddr(options, options.addresses)
    });
  },

  proofEncoder: createActionBoundEncoder({
    id: 'multiAuthenticator',
    createProof: encodeMultiChildProof
  }),

  configEncoder: (authConfig) => {
    requireArray(authConfig.children, 'children');
    requireArray(authConfig.childConfigs, 'childConfigs');
    for (const child of authConfig.children) {
      requireAddress(child, 'child');
    }
    for (const childConfig of authConfig.childConfigs) {
      requireBytes(childConfig, 'childConfig');
    }
    return createMultiAuthConfig(
      /** @type {Address[]} */ (authConfig.children),
      /** @type {Bytes[]} */ (authConfig.childConfigs)
    );
  }
});
