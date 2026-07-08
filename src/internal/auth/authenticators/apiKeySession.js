/**
 * ApiKeySessionAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @typedef {import('../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 *
 * @module internal/auth/authenticators/apiKeySession
 */

import { ValidationError } from '../../../errors/index.js';
import { requireAddress, requireBytes32 } from '../../assert.js';
import { createApiKeySessionAuthConfig } from '../config/createAuthConfig.js';
import { createAuthProofApiKeySession } from '../apiKeySession/onChainProof.js';
import { bindProofToAction } from '../proof/bindProofToAction.js';

/**
 * @param {import('../session/CredentialsSession.js').CredentialsSession | null} session
 * @param {Record<string, unknown>} partial
 */
function applySessionInput(session, partial) {
  const merged = {
    ...partial,
    apiKeySecret: partial.apiKeySecret ?? session?.getApiKeySecret()
  };

  if (merged.apiKeySecret == null) {
    throw new ValidationError(
      'authProof.apiKeySecret is required when no credentials session is active',
      'authProof.apiKeySecret',
      merged.apiKeySecret
    );
  }

  return merged;
}

/**
 * @param {Record<string, unknown>} options
 */
function validatePrepareInput(options) {
  requireAddress(options.keyVaultAddr, 'keyVaultAddr');
  requireBytes32(options.apiKeySecret, 'apiKeySecret');
}

/**
 * @param {MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.apiKeySessionAuth,
    chainId: options.chainId ?? config.chainId
  };
}

/** @type {import('./types.js').BuiltinAuthenticatorSpec} */
export const apiKeySessionAuthenticator = {
  id: 'apiKeySessionAuth',
  flowId: 'apiKeySession',
  addressKey: 'apiKeySessionAuth',

  applySessionInput,
  applyConfigDefaults,
  validatePrepareInput,

  proofEncoder: bindProofToAction({
    id: 'apiKeySessionAuth',
    validateInput: ({ apiKeySecret }) => requireBytes32(apiKeySecret, 'apiKeySecret'),
    createProof: (input) =>
      createAuthProofApiKeySession({
        readProvider: input.readProvider,
        authenticatorAddr: input.authenticatorAddr,
        apiKeySecret: input.apiKeySecret,
        keyVaultAddr: input.keyVaultAddr,
        chainId: input.chainId,
        actionHash: input.actionHash,
        mode: input.mode,
        expiry: input.expiry,
        scopeMask: input.scopeMask
      })
  }),

  configEncoder: {
    id: 'apiKeySessionAuth',
    encode(authConfig) {
      const { apiKeySecret } = authConfig;
      return createApiKeySessionAuthConfig(
        /** @type {Bytes32} */ (apiKeySecret)
      );
    }
  }
};
