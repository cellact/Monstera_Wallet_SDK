/**
 * PasswordMinuteSignatureAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/passwordMinuteSignature
 */

import { requireBytes32 } from '../../validation/assert.js';
import {
  createActionBoundEncoder,
  resolvePasswordHashFromProofInput
} from '../proof/common.js';
import { createAuthProofMinuteSignature } from '../proof/builders/minuteSignature.js';
import {
  createAuthenticatorSpec,
  requirePartialOrSession
} from './createAuthenticatorSpec.js';
import { passwordAuthenticator } from './password.js';

/** @type {BuiltinAuthenticatorSpec} */
export const passwordMinuteSignatureAuthenticator = createAuthenticatorSpec({
  id: 'passwordMinuteSignatureAuth',
  flowId: 'minuteSignature',
  addressKey: 'passwordMinuteSignatureAuth',

  applySessionInput: requirePartialOrSession(
    'passwordHash',
    (session) => session.getPasswordHash(),
    'authProof.passwordHash is required when no credentials session is active'
  ),

  collectResolve: {
    passwordHash: resolvePasswordHashFromProofInput
  },
  mapFields: {
    passwordHash: true
  },
  validate: (options) => requireBytes32(options.passwordHash, 'passwordHash'),

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

  prepareProofResult: (encodeCtx, input) =>
    createAuthProofMinuteSignature({
      provider: encodeCtx.readProvider,
      keyVaultAddr: input.keyVaultAddr,
      authenticatorAddr: input.authenticatorAddr,
      chainId: input.chainId,
      passwordHash: input.passwordHash,
      actionHash: input.actionHash
    })
});
