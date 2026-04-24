/**
 * Internal crypto barrel: mnemonic/seed, auth config/proof bytes, EIP-7702 authorization.
 * Not a public package export; import from other `src/` modules only.
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
