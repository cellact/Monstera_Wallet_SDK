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
  createAuthProofDualFactor,
  createAuthProofPassword
} from './authProof.js';
export {
  AUTH_CONTEXT_TYPEHASH,
  computeParamsHash,
  assertAuthActionInput,
  buildAuthContext,
  fetchKeyVaultActionHash,
  computeAuthenticatorActionHash,
  resolveActionHash
} from './authContext.js';
export { getSelector } from './getSelector.js';
export {
  buildSignAction,
  buildSignMessageAction,
  buildSignTransactionAction,
  buildExecuteWithAuthAction,
  buildUpgradeImplementationAction,
  buildUpgradeImplementationCustomAction,
  buildChangeAuthenticatorAction,
  buildChangeAuthenticatorCustomAction,
  buildImportKeyAction,
  buildDeactivateKeyAction,
  buildActivateKeyAction,
  buildSignWithImportedKeyAction,
  buildSignSolanaAction,
  buildSetChainBaseKeysAction
} from './actions/index.js';
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
