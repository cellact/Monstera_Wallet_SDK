/**
 * Re-exports of {@code ethers} address / hex predicates and common constants.
 *
 * Used by validators, sanitisers and contract clients to validate and normalise addresses without
 * importing {@code ethers} directly.
 *
 * Re-exports:
 * - {@code isAddress} — boolean predicate (does NOT enforce checksum)
 * - {@code getAddress} — returns the EIP-55 checksum form, throws on invalid input
 * - {@code isHexString} — boolean predicate for {@code 0x}-prefixed hex strings
 * - {@code ZeroAddress} — {@code 0x0000…0000} constant
 * - {@code ZeroHash} — 32-byte zero constant
 *
 * @module adapters/ethers/addresses
 */

export {
  isAddress,
  getAddress,
  ZeroHash,
  ZeroAddress,
  isHexString
} from 'ethers';
