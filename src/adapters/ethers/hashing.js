/**
 * Re-exports of {@code ethers} hashing and byte primitives.
 *
 * Used by the auth-config / auth-proof builders, the mnemonic / EIP-7702 helpers, and the various
 * authenticator clients to hash digests and pack typed data without importing {@code ethers}
 * directly.
 *
 * Re-exports:
 * - {@code keccak256} — keccak hash of a byte string
 * - {@code solidityPacked} — non-standard tightly packed encoding (matches {@code abi.encodePacked})
 * - {@code getBytes} — coerce hex / Uint8Array into {@code Uint8Array}
 * - {@code randomBytes} — cryptographically secure random byte string
 * - {@code hexlify} — coerce bytes / numeric input into a {@code 0x}-prefixed hex string
 * - {@code toUtf8Bytes} — UTF-8 encode a string into a {@code Uint8Array}
 *
 * @module adapters/ethers/hashing
 */

export {
  keccak256,
  solidityPacked,
  getBytes,
  randomBytes,
  hexlify,
  toUtf8Bytes
} from 'ethers';
