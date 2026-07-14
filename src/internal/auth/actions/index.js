/**
 * Authenticator management action builders ({@code AuthActionInput} descriptors).
 *
 * @module internal/auth/actions
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
export { buildRotateApiKeyAction } from './apiKeySession.js';
export {
  buildAddAuthenticatorAction,
  buildRemoveAuthenticatorAction
} from './multi.js';
export {
  buildPasswordOrWalletChangePasswordAction,
  buildPasswordOrWalletAddToWhitelistAction,
  buildPasswordOrWalletRemoveFromWhitelistAction,
  buildPasswordOrWalletAddToWhitelistWithProofAction,
} from './passwordOrWalletSignature.js';
