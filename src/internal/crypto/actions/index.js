/**
 * Action builders for KeyVault and authenticator management calls.
 *
 * @module internal/crypto/actions
 */

export { buildChangePasswordAction } from './password.js';
export { buildChangePasswordAction as buildMinuteSignatureChangePasswordAction } from './passwordMinuteSignature.js';
export {
  buildAddToWhitelistAction,
  buildRemoveFromWhitelistAction
} from './walletSignature.js';
export {
  buildChangePasswordAction as buildDualFactorChangePasswordAction,
  buildChangeGuardianAction
} from './dualFactor.js';
export {
  buildAuthenticatorVerifyProbeAction,
  getVerifySelector,
  VERIFY_PROBE_PARAMS_HASH
} from './authenticatorProbe.js';
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
} from './keyVault.js';
