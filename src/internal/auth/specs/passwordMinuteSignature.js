/**
 * PasswordMinuteSignatureAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/passwordMinuteSignature
 */

import { ValidationError } from '../../../errors/index.js';
import { requireAddress, requireBytes32 } from '../../validation/assert.js';
import { createActionBoundEncoder, pickAuthProofPartial } from '../proof/common.js';
import { resolvePasswordHashFromProofInput } from '../proof/passwordInput.js';
import { createAuthProofMinuteSignature } from '../proof/minuteSignature.js';
import { passwordAuthenticator } from './password.js';

/**
 * @param {import('../session/ConnectSession.js').ConnectSession | null} session
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
 * @param {MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    chainId: config.chainId,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.passwordMinuteSignatureAuth
  };
}

/**
 * @param {Record<string, unknown>} options
 * @returns {Record<string, unknown>}
 */
function collectProofInput(options) {
  const partial = pickAuthProofPartial(options);
  return { ...partial, passwordHash: resolvePasswordHashFromProofInput(partial, options) };
}

/**
 * @param {Record<string, unknown>} resolved
 * @param {Address} authenticatorAddr
 * @returns {Record<string, unknown>}
 */
function mapSessionResolved(resolved, authenticatorAddr) {
  return {
    keyVaultAddr: resolved.keyVaultAddr,
    authenticatorAddr,
    passwordHash: resolved.passwordHash
  };
}

/** @type {BuiltinAuthenticatorSpec} */
export const passwordMinuteSignatureAuthenticator = {
  id: 'passwordMinuteSignatureAuth',
  flowId: 'minuteSignature',
  addressKey: 'passwordMinuteSignatureAuth',

  applySessionInput,
  collectProofInput,
  mapSessionResolved,
  applyConfigDefaults,
  validatePrepareInput,

  proofEncoder: createActionBoundEncoder({
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
