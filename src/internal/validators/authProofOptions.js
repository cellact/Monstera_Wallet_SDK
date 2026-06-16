/**
 * Composed validation rules for the auth-proof helpers in {@code internal/crypto/authProof.js}.
 *
 * Holding the rules in one module keeps {@code Monstera}'s public methods, the proof builders,
 * and the underlying crypto helpers aligned — every entry point for a given proof type uses the
 * same assertions, so divergence is impossible.
 *
 * @typedef {import('../../types/index.js').ChainId} ChainId
 * @typedef {import('../../types/index.js').CreateAuthProofWalletSignatureOptions} CreateAuthProofWalletSignatureOptions
 * @typedef {import('../../types/index.js').CreateAuthProofMinuteSignatureWithProviderOptions} CreateAuthProofMinuteSignatureWithProviderOptions
 * @typedef {import('../../types/index.js').CreateAuthProofDualFactorWithProviderOptions} CreateAuthProofDualFactorWithProviderOptions
 *
 * @module internal/validators/authProofOptions
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
 * Assert the inputs of {@link createAuthProofWalletSignature}.
 *
 * @public
 * @param {CreateAuthProofWalletSignatureOptions} options - Caller options
 * @returns {{ normalizedChainId: ChainId }} Validated chain id
 * @throws {ValidationError} If {@code signer} is not a {@code Wallet}/{@code HDNodeWallet}
 *   ({@link requireWalletOrHdNode}); {@code chainId} is missing/invalid ({@link requireChainId});
 *   {@code authenticatorAddr} or {@code keyVaultAddr} fail address validation
 *   ({@link requireAddress}); {@code deadline} is not a positive integer
 *   ({@link requirePositiveInteger}); {@code deadline} is in the past ({@link isInFuture}); or
 *   {@code actionHash} is missing
 */
export function assertWalletSignatureAuthProofOptions(options) {
  const { signer, chainId, authenticatorAddr, deadline, keyVaultAddr, actionHash } = options;

  requireWalletOrHdNode(signer, 'signer');
  const normalizedChainId = requireChainId(chainId, 'chainId');
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requirePositiveInteger(deadline, 'deadline');
  isInFuture(deadline, 'deadline');
  requireBytes32(actionHash, 'actionHash');

  return { normalizedChainId };
}

/**
 * Assert the inputs of {@link createAuthProofMinuteSignature}.
 *
 * @public
 * @param {CreateAuthProofMinuteSignatureWithProviderOptions} options - Caller options
 * @returns {{ normalizedChainId: ChainId }} Validated chain id
 * @throws {ValidationError} If {@code provider} does not expose {@code getBlock};
 *   {@code keyVaultAddr} or {@code authenticatorAddr} fail address validation;
 *   {@code chainId} is missing/invalid; {@code passwordHash} is not a 32-byte hex string; or
 *   {@code actionHash} is missing
 */
export function assertMinuteSignatureAuthProofOptions(options) {
  const { provider, keyVaultAddr, authenticatorAddr, chainId, passwordHash, actionHash } = options;

  if (!provider || typeof provider.getBlock !== 'function') {
    throw new ValidationError('provider must expose getBlock', 'provider', provider);
  }
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  const normalizedChainId = requireChainId(chainId, 'chainId');
  requireBytes32(passwordHash, 'passwordHash');
  requireBytes32(actionHash, 'actionHash');

  return { normalizedChainId };
}

/**
 * Assert the inputs of {@link createAuthProofDualFactor}.
 *
 * @description Re-uses {@link assertMinuteSignatureAuthProofOptions} for the shared minute-proof
 * fields, then adds the dual-factor-specific guardian signer + EIP-712 deadline checks.
 *
 * @public
 * @param {CreateAuthProofDualFactorWithProviderOptions} options - Caller options
 * @returns {{ normalizedChainId: ChainId }} Validated chain id
 * @throws {ValidationError} Forwarded from {@link assertMinuteSignatureAuthProofOptions}; plus
 *   thrown if {@code signer} is not a {@code Wallet}/{@code HDNodeWallet}, or {@code deadline} is not
 *   a positive integer or is in the past
 */
export function assertDualFactorAuthProofOptions(options) {
  const { signer, deadline } = options;

  const { normalizedChainId } = assertMinuteSignatureAuthProofOptions(options);

  requireWalletOrHdNode(signer, 'signer');
  requirePositiveInteger(deadline, 'deadline');
  isInFuture(deadline, 'deadline');

  return { normalizedChainId };
}
