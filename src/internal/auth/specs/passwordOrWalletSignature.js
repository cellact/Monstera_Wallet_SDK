/**
 * PasswordOrWalletSignatureAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/passwordOrWalletSignature
 */

import { ValidationError } from '../../../errors/index.js';
import {
  requireAddress,
  requireArray,
  requireBytes32,
  requireUtf8Bytes,
  requireWalletOrHdNode,
} from '../../validation/assert.js';
import { createPasswordOrWalletSigAuthConfig } from '../config/bytes.js';
import { createActionBoundEncoder, defaultProofDeadline, pickAuthProofPartial } from '../proof/common.js';
import { createAuthProofPasswordOrWalletSignature } from '../proof/builders/passwordOrWalletSignature.js';

/** @type {1} */
export const METHOD_PASSWORD = 1;

/** @type {2} */
export const METHOD_WALLET_SIGNATURE = 2;

/**
 * @param {'password' | 'walletSignature' | number | undefined} method
 * @returns {'password' | 'walletSignature'}
 */
function normalizeMethod(method) {
  if (method === METHOD_PASSWORD || method === 'password') {
    return 'password';
  }
  if (method === METHOD_WALLET_SIGNATURE || method === 'walletSignature') {
    return 'walletSignature';
  }
  return /** @type {'password' | 'walletSignature' | undefined} */ (method);
}

/**
 * @param {Record<string, unknown>} input
 * @returns {'password' | 'walletSignature'}
 */
function resolveMethod(input) {
  const explicit = normalizeMethod(/** @type {'password' | 'walletSignature' | number | undefined} */ (input.method));
  if (explicit) {
    return explicit;
  }
  if (input.signer != null) {
    return 'walletSignature';
  }
  if (input.password != null) {
    return 'password';
  }
  throw new ValidationError(
    'authProof.method, authProof.signer, or authProof.password is required for PasswordOrWalletSignatureAuthenticator',
    'authProof.method',
    input.method
  );
}

/**
 * @param {import('../session/ConnectSession.js').ConnectSession | null} session
 * @param {Record<string, unknown>} partial
 * @returns {Record<string, unknown>}
 */
function applySessionInput(session, partial) {
  const merged = { ...partial };

  if (merged.password == null && session?.hasPassword()) {
    merged.password = session.getPasswordBytes();
  }

  if (merged.signer == null && merged.password == null) {
    throw new ValidationError(
      'authProof.password or authProof.signer is required for PasswordOrWalletSignatureAuthenticator',
      'authProof',
      partial
    );
  }

  return merged;
}

/**
 * @param {Record<string, unknown>} options
 */
function validatePrepareInput(options) {
  requireAddress(options.keyVaultAddr, 'keyVaultAddr');
  const method = resolveMethod(options);
  if (method === 'walletSignature') {
    requireWalletOrHdNode(options.signer, 'signer');
  } else {
    requireUtf8Bytes(options.password, 'password');
  }
}

/**
 * @param {MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.passwordOrWalletSigAuth,
    deadline: options.deadline ?? defaultProofDeadline(),
    chainId: config.chainId,
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
    method: partial.method ?? options.method,
    password: partial.password ?? options.password ?? options.currentPassword,
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
    method: resolved.method,
    password: resolved.currentPassword ?? resolved.password,
    signer: resolved.signer,
    deadline: resolved.deadline
  };
}

/** @type {BuiltinAuthenticatorSpec} */
export const passwordOrWalletSignatureAuthenticator = {
  id: 'passwordOrWalletSigAuth',
  flowId: 'passwordOrWalletSignature',
  addressKey: 'passwordOrWalletSigAuth',

  applySessionInput,
  collectProofInput,
  mapSessionResolved,
  applyConfigDefaults,
  validatePrepareInput,

  proofEncoder: createActionBoundEncoder({
    id: 'passwordOrWalletSigAuth',
    withDeadline: true,
    validateInput: (input) => {
      resolveMethod(input);
    },
    createProof: (input) => createAuthProofPasswordOrWalletSignature(input),
  }),

  configEncoder: {
    id: 'passwordOrWalletSigAuth',
    encode(authConfig) {
      const { passwordHash, initialWhitelist } = authConfig;
      requireBytes32(passwordHash, 'passwordHash');
      requireArray(initialWhitelist, 'initialWhitelist');
      for (const address of initialWhitelist) {
        requireAddress(address, 'initialWhitelist.address');
      }
      return createPasswordOrWalletSigAuthConfig(
        /** @type {Bytes32} */ (passwordHash),
        /** @type {Address[]} */ (initialWhitelist)
      );
    },
  },
};
