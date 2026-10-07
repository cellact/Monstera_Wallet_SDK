/**
 * PasswordOrWalletSignatureAuthenticator auth-proof builder.
 *
 * @module internal/auth/proof/builders/passwordOrWalletSignature
 */

import { defaultAbiCoder } from '../../../../adapters/ethers/encoding.js';
import {
  requireTypedDataSigner,
  requireAddress,
  requireBytes32,
  requireNumber,
} from '../../../validation/assert.js';
import { signTypedData } from '../../../crypto/eip712.js';
import { sdkErrorPipeline } from '../../../../errors/pipeline.js';
import { createAuthProofPassword } from './abiProofs.js';
import { createAuthProofWalletSignature } from './walletSignature.js';

/** @type {1} */
const METHOD_PASSWORD = 1;

/** @type {2} */
const METHOD_WALLET_SIGNATURE = 2;

const LINK_WALLET_EIP712_FIELDS = [
  { name: 'wallet', type: 'address' },
  { name: 'newAddress', type: 'address' },
  { name: 'nonce', type: 'bytes32' },
  { name: 'deadline', type: 'uint256' },
  { name: 'actionHash', type: 'bytes32' },
];

/**
 * @param {'password' | 'walletSignature' | number | undefined} method
 * @returns {'password' | 'walletSignature' | undefined}
 */
function _normalizePasswordOrWalletMethod(method) {
  if (method === METHOD_PASSWORD || method === 'password') {
    return 'password';
  }
  if (method === METHOD_WALLET_SIGNATURE || method === 'walletSignature') {
    return 'walletSignature';
  }
  return undefined;
}

/**
 * @param {Object} options
 * @returns {Promise<EncodedAuthProofPasswordOrWalletSignature>}
 */
export async function createAuthProofPasswordOrWalletSignature(options = {}) {
  const method = _normalizePasswordOrWalletMethod(options.method)
    ?? (options.signer != null ? 'walletSignature' : 'password');

  if (method === 'password') {
    const methodProof = createAuthProofPassword({
      password: options.password,
      actionHash: options.actionHash,
    });
    return defaultAbiCoder.encode(['uint8', 'bytes'], [METHOD_PASSWORD, methodProof]);
  }

  const methodProof = await createAuthProofWalletSignature({
    ...options,
    eip712ContractName: 'PasswordOrWalletSignatureAuthenticator',
  });
  return defaultAbiCoder.encode(['uint8', 'bytes'], [METHOD_WALLET_SIGNATURE, methodProof]);
}

/**
 * @param {Object} options
 * @returns {Promise<Bytes>}
 */
export async function createLinkWalletSignature(options = {}) {
  const {
    linkSigner,
    keyVaultAddr,
    newAddress,
    nonce,
    deadline,
    actionHash,
    authenticatorAddr,
    chainId,
  } = options;

  requireTypedDataSigner(linkSigner, 'linkSigner');
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requireAddress(newAddress, 'newAddress');
  requireBytes32(nonce, 'nonce');
  requireNumber(deadline, 'deadline', { allowBigInt: true });
  requireBytes32(actionHash, 'actionHash');
  requireAddress(authenticatorAddr, 'authenticatorAddr');

  const domain = {
    name: 'PasswordOrWalletSignatureAuthenticator',
    version: '1',
    chainId,
    verifyingContract: authenticatorAddr,
  };
  const types = { LinkWallet: LINK_WALLET_EIP712_FIELDS };
  const value = { wallet: keyVaultAddr, newAddress, nonce, deadline, actionHash };

  try {
    return await signTypedData({ signer: linkSigner, domain, types, value });
  } catch (error) {
    sdkErrorPipeline.rethrow(error, {
      authProofType: 'password-or-wallet link signature',
      functionName: 'createLinkWalletSignature',
      validationExtra: { deadline },
    });
  }
}
