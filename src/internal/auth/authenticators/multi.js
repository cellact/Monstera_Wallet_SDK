/**
 * MultiAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 * @typedef {import('../../../types/index.js').AuthConfigInputOptions} AuthConfigInputOptions
 *
 * @module internal/auth/authenticators/multi
 */

import { ValidationError } from '../../../errors/index.js';
import { requireAddress, requireArray, requireBytes } from '../../assert.js';
import { createMultiAuthConfig } from '../config/createAuthConfig.js';
import { createAuthProofMulti } from '../proof/createAuthProof.js';
import { resolveActionHash } from '../context/createAuthContext.js';
import { resolveChildAddr, resolveChildSpec } from './resolveChild.js';

/**
 * @param {MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    addresses: options.addresses ?? config.addresses,
    chainId: config.chainId,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.multiAuthenticator
  };
}

/**
 * @param {import('../../../types/index.js').AuthProofEncodeContext} ctx
 * @param {Record<string, unknown>} input
 */
async function encodeMultiProof(ctx, input) {
  const childAddr = resolveChildAddr(input, ctx.addresses);
  const childSpec = resolveChildSpec(input, ctx.addresses);

  const actionHash = await resolveActionHash(ctx, {
    action: input.action,
    actionHash: input.actionHash
  });

  const childCtx = { ...ctx, authenticatorAddr: childAddr };
  const childInput = {
    ...input,
    authenticatorAddr: childAddr,
    actionHash
  };

  const childProof = await childSpec.proofEncoder.encode(childCtx, childInput);
  return createAuthProofMulti({ child: childAddr, childProof });
}

/**
 * @param {import('../../../types/index.js').CreateWalletAuthEncoder} childRegistry
 * @returns {import('../../../types/index.js').CreateWalletAuthEncoder}
 */
export function wrapMultiConfigEncoder(childRegistry) {
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

/** @type {import('./types.js').BuiltinAuthenticatorSpec} */
export const multiAuthenticator = {
  id: 'multiAuthenticator',
  flowId: 'multi',
  addressKey: 'multiAuthenticator',

  applySessionInput(session, partial) {
    const addresses = partial.addresses;
    const childFlowId = partial.childFlowId ?? partial.viaChildFlowId;
    if (addresses != null && childFlowId != null) {
      const childSpec = resolveChildSpec({ childFlowId }, addresses);
      return childSpec.applySessionInput(session, partial);
    }
    return partial;
  },

  applyConfigDefaults,
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

  proofEncoder: {
    id: 'multiAuthenticator',
    encode: encodeMultiProof
  },

  configEncoder: {
    id: 'multiAuthenticator',
    encode(authConfig) {
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
  }
};
