/**
 * PasswordOrWalletSignatureAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/authenticators/passwordOrWalletSignature
 */

import { ValidationError } from '../../../errors/index.js';
import {
  requireAddress,
  requireArray,
  requireBytes32,
  requireUtf8Bytes,
  requireWalletOrHdNode,
} from '../../assert.js';
import { createPasswordOrWalletSigAuthConfig } from '../config/createAuthConfig.js';
import { bindProofToAction } from '../proof/bindProofToAction.js';
import { createAuthProofPasswordOrWalletSignature } from '../proof/createAuthProof.js';
import { defaultProofDeadline } from './deadline.js';

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
 * @param {import('../session/CredentialsSession.js').CredentialsSession | null} session
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
 * @param {import('../../../types/index.js').MonsteraConfigOptions} config
 * @param {Record<string, unknown>} options
 */
function applyConfigDefaults(config, options) {
  return {
    ...options,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.passwordOrWalletSigAuth,
    deadline: options.deadline ?? defaultProofDeadline(),
    chainId: options.chainId ?? config.chainId,
  };
}

/** @type {import('./types.js').BuiltinAuthenticatorSpec} */
export const passwordOrWalletSignatureAuthenticator = {
  id: 'passwordOrWalletSigAuth',
  flowId: 'passwordOrWalletSignature',
  addressKey: 'passwordOrWalletSigAuth',

  applySessionInput,
  applyConfigDefaults,
  validatePrepareInput,

  proofEncoder: bindProofToAction({
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
        /** @type {import('../../../types/index.js').Bytes32} */ (passwordHash),
        /** @type {import('../../../types/index.js').Address[]} */ (initialWhitelist)
      );
    },
  },
};
