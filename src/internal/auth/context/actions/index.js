/**
 * Authenticator management action builders ({@code AuthActionInput} descriptors).
 *
 * @module internal/auth/context/actions
 */

export { buildChangePasswordAction } from './authenticator/password.js';
export { buildChangePasswordAction as buildMinuteSignatureChangePasswordAction } from './authenticator/passwordMinuteSignature.js';
export {
  buildAddToWhitelistAction,
  buildRemoveFromWhitelistAction
} from './authenticator/walletSignature.js';
export {
  buildChangePasswordAction as buildDualFactorChangePasswordAction,
  buildChangeGuardianAction
} from './authenticator/dualFactor.js';
export { buildRotateApiKeyAction } from './authenticator/apiKeySession.js';
export {
  buildAddAuthenticatorAction,
  buildRemoveAuthenticatorAction
} from './authenticator/multi.js';
export {
  buildAuthenticatorVerifyProbeAction,
  getVerifySelector,
  VERIFY_PROBE_PARAMS_HASH
} from './authenticator/authenticatorProbe.js';
