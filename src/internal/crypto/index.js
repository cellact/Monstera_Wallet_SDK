/**
 * Cryptographic primitives (BIP-39 mnemonics).
 *
 * Vault action builders and EIP-7702 helpers live under {@code internal/vault}.
 * Auth config, proof, and context bytes live under {@code internal/auth}.
 * This barrel re-exports the legacy surface for callers that still import from {@code internal/crypto}.
 *
 * @module internal/crypto
 */

export { generateMnemonic, deriveSeed } from './mnemonic.js';

export { createWalletSigAuthConfig, createDualFactorAuthConfig, createMultiAuthConfig } from '../auth/config/createAuthConfig.js';
export {
  createAuthProofWalletSignature,
  createAuthProofMinuteSignature,
  createAuthProofDualFactor,
  createAuthProofPassword,
  createAuthProofApiKeySession,
  createAuthProofMulti
} from '../auth/proof/createAuthProof.js';
export { isApiKeySessionTokenMode } from '../auth/apiKeySession/mode.js';
export { MODE_TOKEN, MODE_ACTION, SCOPE_SIGN_ALL, SCOPE_ALL } from '../auth/apiKeySession/constants.js';
export {
  AUTH_CONTEXT_TYPEHASH,
  computeParamsHash,
  assertAuthActionInput,
  buildManagementAction,
  buildAuthContext,
  fetchKeyVaultActionHash,
  computeAuthenticatorActionHash,
  resolveActionHash
} from '../auth/context/createAuthContext.js';
export {
  buildChangePasswordAction,
  buildMinuteSignatureChangePasswordAction,
  buildDualFactorChangePasswordAction,
  buildChangeGuardianAction,
  buildRotateApiKeyAction,
  buildAddAuthenticatorAction,
  buildRemoveAuthenticatorAction,
  buildAddToWhitelistAction,
  buildRemoveFromWhitelistAction,
  buildAuthenticatorVerifyProbeAction,
  getVerifySelector,
  VERIFY_PROBE_PARAMS_HASH
} from '../auth/context/actions/index.js';
export {
  getSelector,
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
  buildSetChainBaseKeysAction,
  normalizeAuthorizationTuple,
  hashAuthorization,
  verifyAuthorization,
  fetchAuthorizationChainId,
  fetchAuthorizationNonce,
  createImplCall,
  toChecksumAddress,
  decodeSignAuthorizationResult,
  finalizeSignedAuthorizationResult
} from '../vault/index.js';
