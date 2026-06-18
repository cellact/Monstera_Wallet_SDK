/**
 * PasswordMinuteSignatureAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/authenticators/passwordMinuteSignature
 */

import { ValidationError } from '../../../errors/index.js';
import { requireAddress, requireBytes32 } from '../../assert.js';
import { bindProofToAction } from '../proof/bindProofToAction.js';
import { createAuthProofMinuteSignature } from '../proof/createAuthProof.js';
import { passwordAuthenticator } from './password.js';

/**
 * @param {import('../session/CredentialsSession.js').CredentialsSession | null} session
 * @param {Record<string, unknown>} partial
 */
function applySessionInput(session, partial) {
  if (partial.passwordHash != null) {
    return partial;
  }
  if (!session) {
    throw new ValidationError(
      'authProof.passwordHash is required when no credentials session is active',
      'authProof.passwordHash',
      partial.passwordHash
    );
  }
  return { ...partial, passwordHash: session.getPasswordHash() };
}

/**
 * @param {Record<string, unknown>} options
 */
function validatePrepareInput(options) {
  requireAddress(options.keyVaultAddr, 'keyVaultAddr');
  requireBytes32(options.passwordHash, 'passwordHash');
}

/**
 * @param {import('../../../types/index.js').MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    chainId: options.chainId ?? config.chainId,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.passwordMinuteSignatureAuth
  };
}

/** @type {import('./types.js').BuiltinAuthenticatorSpec} */
export const passwordMinuteSignatureAuthenticator = {
  id: 'passwordMinuteSignatureAuth',
  flowId: 'minuteSignature',
  addressKey: 'passwordMinuteSignatureAuth',

  applySessionInput,
  applyConfigDefaults,
  validatePrepareInput,

  proofEncoder: bindProofToAction({
    id: 'passwordMinuteSignatureAuth',
    createProof: async ({
      readProvider,
      keyVaultAddr,
      authenticatorAddr,
      chainId,
      passwordHash,
      actionHash
    }) => {
      const result = await createAuthProofMinuteSignature({
        provider: readProvider,
        keyVaultAddr,
        authenticatorAddr,
        chainId,
        passwordHash,
        actionHash
      });
      return result.authProof;
    }
  }),

  configEncoder: {
    id: 'passwordMinuteSignatureAuth',
    encode(authConfig) {
      return passwordAuthenticator.configEncoder.encode(authConfig);
    }
  },

  async prepareProofResult(encodeCtx, input) {
    return createAuthProofMinuteSignature({
      provider: encodeCtx.readProvider,
      keyVaultAddr: input.keyVaultAddr,
      authenticatorAddr: input.authenticatorAddr,
      chainId: input.chainId,
      passwordHash: input.passwordHash,
      actionHash: input.actionHash
    });
  }
};
