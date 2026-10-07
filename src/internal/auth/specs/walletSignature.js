/**
 * WalletSignatureAuthenticator — create-wallet config, proof encoding, and defaults.
 *
 * @module internal/auth/specs/walletSignature
 */

import { requireTypedDataSigner } from '../../validation/assert.js';
import { createWalletSigAuthConfig } from '../config/bytes.js';
import { createActionBoundEncoder } from '../proof/common.js';
import { createAuthProofWalletSignature } from '../proof/builders/walletSignature.js';
import {
  createAuthenticatorSpec,
  requirePartialField
} from './createAuthenticatorSpec.js';

/** @type {BuiltinAuthenticatorSpec} */
export const walletSignatureAuthenticator = createAuthenticatorSpec({
  id: 'walletSignatureAuth',
  flowId: 'walletSignature',
  addressKey: 'walletSignatureAuth',
  withDeadline: true,

  applySessionInput: requirePartialField(
    'signer',
    'authProof.signer is required for WalletSignatureAuthenticator; pass a whitelisted signer with signTypedData'
  ),

  collectKeys: ['signer', 'deadline'],
  mapFields: {
    signer: true,
    deadline: true
  },
  validate: (options) => requireTypedDataSigner(options.signer, 'signer'),

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

  configEncoder: (authConfig) =>
    createWalletSigAuthConfig(/** @type {Address[]} */ (authConfig.initialWhitelist))
});
