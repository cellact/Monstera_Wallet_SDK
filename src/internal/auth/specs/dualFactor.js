/**
 * DualFactorAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/dualFactor
 */

import { ValidationError } from '../../../errors/index.js';
import { requireBytes32, requireTypedDataSigner } from '../../validation/assert.js';
import { createDualFactorAuthConfig } from '../config/bytes.js';
import {
  createActionBoundEncoder,
  resolvePasswordHashFromProofInput
} from '../proof/common.js';
import { createAuthProofDualFactor } from '../proof/builders/dualFactor.js';
import { createAuthenticatorSpec } from './createAuthenticatorSpec.js';

/** @type {BuiltinAuthenticatorSpec} */
export const dualFactorAuthenticator = createAuthenticatorSpec({
  id: 'dualFactorAuth',
  flowId: 'dualFactor',
  addressKey: 'dualFactorAuth',
  withDeadline: true,

  applySessionInput(session, partial) {
    const merged = {
      ...partial,
      passwordHash: partial.passwordHash ?? session?.getPasswordHash()
    };

    if (merged.passwordHash == null) {
      throw new ValidationError(
        'authProof.passwordHash is required when no credentials session is active',
        'authProof.passwordHash',
        merged.passwordHash
      );
    }

    if (merged.signer == null) {
      throw new ValidationError(
        'authProof.signer is required for DualFactorAuthenticator; pass the guardian signer with signTypedData',
        'authProof.signer',
        merged.signer
      );
    }

    return merged;
  },

  collectKeys: ['signer', 'deadline'],
  collectResolve: {
    passwordHash: resolvePasswordHashFromProofInput
  },
  mapFields: {
    passwordHash: true,
    signer: true,
    deadline: true
  },
  validate: (options) => {
    requireBytes32(options.passwordHash, 'passwordHash');
    requireTypedDataSigner(options.signer, 'signer');
  },

  proofEncoder: createActionBoundEncoder({
    id: 'dualFactorAuth',
    withDeadline: true,
    createProof: ({
      readProvider,
      keyVaultAddr,
      passwordHash,
      signer,
      authenticatorAddr,
      deadline,
      chainId,
      actionHash
    }) =>
      createAuthProofDualFactor({
        provider: readProvider,
        keyVaultAddr,
        passwordHash,
        signer,
        authenticatorAddr,
        deadline,
        chainId,
        actionHash
      })
  }),

  configEncoder: (authConfig) =>
    createDualFactorAuthConfig(
      /** @type {Bytes32} */ (authConfig.passwordHash),
      /** @type {Address} */ (authConfig.guardianAddr)
    )
});
