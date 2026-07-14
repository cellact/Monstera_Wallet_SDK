/**
 * Trivial ABI-encoded auth proofs (no signing or provider calls).
 *
 * @module internal/auth/proof/abiProofs
 */

import { defaultAbiCoder } from '../../../adapters/ethers/encoding.js';
import { requireUtf8Bytes, requireBytes32, requireAddress, requireNonEmptyBytes } from '../../validation/assert.js';

/**
 * Build {@code authProof} bytes for the {@code PasswordAuthenticator}.
 *
 * @param {Object} options
 * @param {Uint8Array} options.password - UTF-8 password bytes
 * @param {Bytes32} options.actionHash - Canonical action hash
 * @returns {EncodedAuthProofPassword}
 */
export function createAuthProofPassword({ password, actionHash }) {
  requireUtf8Bytes(password, 'password');
  requireBytes32(actionHash, 'actionHash');
  return defaultAbiCoder.encode(['bytes', 'bytes32'], [password, actionHash]);
}

/**
 * Build {@code authProof} bytes for the {@code MultiAuthenticator}.
 *
 * @param {Object} options
 * @param {Address} options.child - Enabled child authenticator address
 * @param {Bytes} options.childProof - Child authenticator proof bytes
 * @returns {EncodedAuthProofMulti}
 */
export function createAuthProofMulti({ child, childProof }) {
  requireAddress(child, 'child');
  requireNonEmptyBytes(childProof, 'childProof');
  return defaultAbiCoder.encode(['address', 'bytes'], [child, childProof]);
}
