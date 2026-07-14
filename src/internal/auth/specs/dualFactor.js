/**
 * DualFactorAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/dualFactor
 */

import { ValidationError } from '../../../errors/index.js';
import { requireAddress, requireBytes32, requireWalletOrHdNode } from '../../assert.js';
import { createDualFactorAuthConfig } from '../encoding/authConfigBytes.js';
import { createActionBoundEncoder } from '../encoding/createActionBoundEncoder.js';
import { createAuthProofDualFactor } from '../encoding/createAuthProof.js';
import {
  defaultProofDeadline,
  pickAuthProofPartial,
  resolvePasswordHashFromProofInput
} from '../encoding/proofDefaults.js';

/**
 * @param {import('../session/ConnectSession.js').CredentialsSession | null} session
 * @param {Record<string, unknown>} partial
 */
function applySessionInput(session, partial) {
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
      'authProof.signer is required for DualFactorAuthenticator; pass the guardian Wallet or HDNodeWallet',
      'authProof.signer',
      merged.signer
    );
  }

  return merged;
}

/**
 * @param {Record<string, unknown>} options
 */
function validatePrepareInput(options) {
  requireAddress(options.keyVaultAddr, 'keyVaultAddr');
  requireBytes32(options.passwordHash, 'passwordHash');
  requireWalletOrHdNode(options.signer, 'signer');
}

/**
 * @param {MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.dualFactorAuth,
    deadline: options.deadline ?? defaultProofDeadline(),
    chainId: config.chainId
  };
}

/**
 * @param {Record<string, unknown>} options
 * @returns {Record<string, unknown>}
 */
function collectProofInput(options) {
  const partial = pickAuthProofPartial(options);
  return {
    ...partial,
    passwordHash: resolvePasswordHashFromProofInput(partial, options),
    signer: partial.signer ?? options.signer,
    deadline: partial.deadline ?? options.deadline
  };
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
    passwordHash: resolved.passwordHash,
    signer: resolved.signer,
    deadline: resolved.deadline
  };
}

/** @type {import('./types.js').BuiltinAuthenticatorSpec} */
export const dualFactorAuthenticator = {
  id: 'dualFactorAuth',
  flowId: 'dualFactor',
  addressKey: 'dualFactorAuth',

  applySessionInput,
  collectProofInput,
  mapSessionResolved,
  applyConfigDefaults,
  validatePrepareInput,

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

  configEncoder: {
    id: 'dualFactorAuth',
    encode(authConfig) {
      const { passwordHash, guardianAddr } = authConfig;
      return createDualFactorAuthConfig(
        /** @type {Bytes32} */ (passwordHash),
        /** @type {Address} */ (guardianAddr)
      );
    }
  }
};
