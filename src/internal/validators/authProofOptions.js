/**
 * Composed validation for auth-proof helpers ({@link ../crypto/authProof.js}).
 * Single place for rules so {@link Monstera} delegates and crypto share one policy without drift.
 *
 * @typedef {import('../../types/index.js').ChainId} ChainId
 * @typedef {import('../../types/index.js').CreateAuthProofWalletSignatureOptions} CreateAuthProofWalletSignatureOptions
 * @typedef {import('../../types/index.js').CreateAuthProofMinuteSignatureWithProviderOptions} CreateAuthProofMinuteSignatureWithProviderOptions
 * @typedef {import('../../types/index.js').CreateAuthProofDualFactorWithProviderOptions} CreateAuthProofDualFactorWithProviderOptions
 */

import {
  requireAddress,
  requireBytes32,
  requireWalletOrHdNode,
  requireChainId,
  requirePositiveInteger,
  isInFuture
} from '../assert.js';
import { ValidationError } from '../../errors/index.js';

/**
 * @param {CreateAuthProofWalletSignatureOptions} options
 * @returns {{ normalizedChainId: ChainId }}
 */
export function assertWalletSignatureAuthProofOptions(options) {
  const { signer, chainId, authenticatorAddr, deadline, keyVaultAddr } = options;

  requireWalletOrHdNode(signer, 'signer');
  const normalizedChainId = requireChainId(chainId, 'chainId');
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requirePositiveInteger(deadline, 'deadline');
  isInFuture(deadline, 'deadline');

  return { normalizedChainId };
}

/**
 * @param {CreateAuthProofMinuteSignatureWithProviderOptions} options
 * @returns {{ normalizedChainId: ChainId }}
 */
export function assertMinuteSignatureAuthProofOptions(options) {
  const { provider, keyVaultAddr, authenticatorAddr, chainId, passwordHash } = options;

  if (!provider || typeof provider.getBlock !== 'function') {
    throw new ValidationError('provider must expose getBlock', 'provider', provider);
  }
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  const normalizedChainId = requireChainId(chainId, 'chainId');
  requireBytes32(passwordHash, 'passwordHash');

  return { normalizedChainId };
}

/**
 * Minute proof inputs plus dual-factor-only fields (guardian signer + EIP-712 deadline).
 *
 * @param {CreateAuthProofDualFactorWithProviderOptions} options
 * @returns {{ normalizedChainId: ChainId }}
 */
export function assertDualFactorAuthProofOptions(options) {
  const { signer, deadline } = options;

  const { normalizedChainId } = assertMinuteSignatureAuthProofOptions(options);

  requireWalletOrHdNode(signer, 'signer');
  requirePositiveInteger(deadline, 'deadline');
  isInFuture(deadline, 'deadline');

  return { normalizedChainId };
}
