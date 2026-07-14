/**
 * WalletSignatureAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/walletSignature
 */

import { ValidationError } from '../../../errors/index.js';
import { requireAddress, requireWalletOrHdNode } from '../../validation/assert.js';
import { createWalletSigAuthConfig } from '../encoding/authConfigBytes.js';
import { createActionBoundEncoder } from '../encoding/createActionBoundEncoder.js';
import { createAuthProofWalletSignature } from '../encoding/createAuthProof.js';
import { defaultProofDeadline, pickAuthProofPartial } from '../encoding/proofDefaults.js';

/**
 * @param {import('../session/ConnectSession.js').ConnectSession | null} _session
 * @param {Record<string, unknown>} partial
 */
function applySessionInput(_session, partial) {
  if (partial.signer == null) {
    throw new ValidationError(
      'authProof.signer is required for WalletSignatureAuthenticator; pass a whitelisted Wallet or HDNodeWallet',
      'authProof.signer',
      partial.signer
    );
  }
  return partial;
}

/**
 * @param {Record<string, unknown>} options
 */
function validatePrepareInput(options) {
  requireAddress(options.keyVaultAddr, 'keyVaultAddr');
  requireWalletOrHdNode(options.signer, 'signer');
}

/**
 * @param {MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.walletSignatureAuth,
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
    signer: resolved.signer,
    deadline: resolved.deadline
  };
}

/** @type {BuiltinAuthenticatorSpec} */
export const walletSignatureAuthenticator = {
  id: 'walletSignatureAuth',
  flowId: 'walletSignature',
  addressKey: 'walletSignatureAuth',

  applySessionInput,
  collectProofInput,
  mapSessionResolved,
  applyConfigDefaults,
  validatePrepareInput,

  proofEncoder: createActionBoundEncoder({
    id: 'walletSignatureAuth',
    withDeadline: true,
    createProof: ({
      signer,
      chainId,
      authenticatorAddr,
      keyVaultAddr,
      deadline,
      actionHash
    }) =>
      createAuthProofWalletSignature({
        signer,
        chainId,
        authenticatorAddr,
        deadline,
        keyVaultAddr,
        actionHash
      })
  }),

  configEncoder: {
    id: 'walletSignatureAuth',
    encode(authConfig) {
      const { initialWhitelist } = authConfig;
      return createWalletSigAuthConfig(
        /** @type {Address[]} */ (initialWhitelist)
      );
    }
  }
};
