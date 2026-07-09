/**
 * WalletSignatureAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/authenticators/walletSignature
 */

import { ValidationError } from '../../../errors/index.js';
import { requireAddress, requireWalletOrHdNode } from '../../assert.js';
import { createWalletSigAuthConfig } from '../config/createAuthConfig.js';
import { bindProofToAction } from '../proof/bindProofToAction.js';
import { createAuthProofWalletSignature } from '../proof/createAuthProof.js';
import { defaultProofDeadline } from './deadline.js';

/**
 * @param {import('../session/CredentialsSession.js').CredentialsSession | null} _session
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
 * @param {import('../../../types/index.js').MonsteraConfigOptions} config
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

/** @type {import('./types.js').BuiltinAuthenticatorSpec} */
export const walletSignatureAuthenticator = {
  id: 'walletSignatureAuth',
  flowId: 'walletSignature',
  addressKey: 'walletSignatureAuth',

  applySessionInput,
  applyConfigDefaults,
  validatePrepareInput,

  proofEncoder: bindProofToAction({
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
        /** @type {import('../../../types/index.js').Address[]} */ (initialWhitelist)
      );
    }
  }
};
