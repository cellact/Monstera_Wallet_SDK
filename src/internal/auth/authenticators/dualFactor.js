/**
 * DualFactorAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/authenticators/dualFactor
 */

import { ValidationError } from '../../../errors/index.js';
import { requireAddress, requireBytes32, requireWalletOrHdNode } from '../../assert.js';
import { createDualFactorAuthConfig } from '../config/createAuthConfig.js';
import { bindProofToAction } from '../proof/bindProofToAction.js';
import { createAuthProofDualFactor } from '../proof/createAuthProof.js';
import { defaultProofDeadline } from './deadline.js';

/**
 * @param {import('../session/CredentialsSession.js').CredentialsSession | null} session
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
 * @param {import('../../../types/index.js').MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.dualFactorAuth,
    deadline: options.deadline ?? defaultProofDeadline(),
    chainId: options.chainId ?? config.chainId
  };
}

/** @type {import('./types.js').BuiltinAuthenticatorSpec} */
export const dualFactorAuthenticator = {
  id: 'dualFactorAuth',
  flowId: 'dualFactor',
  addressKey: 'dualFactorAuth',

  applySessionInput,
  applyConfigDefaults,
  validatePrepareInput,

  proofEncoder: bindProofToAction({
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
        /** @type {import('../../../types/index.js').Bytes32} */ (passwordHash),
        /** @type {import('../../../types/index.js').Address} */ (guardianAddr)
      );
    }
  }
};
