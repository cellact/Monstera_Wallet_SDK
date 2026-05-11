/**
 * Internal crypto barrel.
 *
 * Re-exports every primitive used by the auth-config / auth-proof encoders and the wallet-creation
 * flows that need EIP-7702 authorisations or BIP-39 mnemonics. NOT a public package export — only
 * other modules under {@code src/} should import from here.
 *
 * @module internal/crypto
 */

export { createWalletSigAuthConfig, createDualFactorAuthConfig } from './authConfig.js';
export {
  createAuthProofWalletSignature,
  createAuthProofMinuteSignature,
  createAuthProofDualFactor
} from './authProof.js';
export { generateMnemonic, deriveSeed } from './mnemonic.js';
export {
  normalizeAuthorizationTuple,
  hashAuthorization,
  verifyAuthorization,
  fetchAuthorizationChainId,
  fetchAuthorizationNonce,
  createImplCall,
  toChecksumAddress,
  decodeSignAuthorizationResult,
  finalizeSignedAuthorizationResult
} from './authorization.js';
