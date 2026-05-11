/**
 * Re-exports of {@code ethers} signature recovery and EIP-7702 authorization helpers.
 *
 * Used by signature-based authenticators and the EIP-7702 authorization helpers in
 * {@code internal/crypto/} to verify or recover signers without importing {@code ethers}
 * directly.
 *
 * Re-exports:
 * - {@code verifyMessage} — recover the signer of an EIP-191 personal-sign message
 * - {@code recoverAddress} — recover the signer of an arbitrary 32-byte digest
 * - {@code hashAuthorization} — compute the EIP-7702 authorization digest
 * - {@code verifyAuthorization} — recover the signer of an EIP-7702 authorization
 *
 * @module adapters/ethers/signing
 */

export {
  verifyMessage,
  recoverAddress,
  hashAuthorization,
  verifyAuthorization
} from 'ethers';
