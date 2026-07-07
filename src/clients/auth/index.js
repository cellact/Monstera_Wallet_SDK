/**
 * Authenticator clients barrel.
 *
 * Re-exports the {@link AuthenticatorClient} registry plus each individual authenticator client
 * ({@link PasswordAuthenticatorClient}, {@link WalletSignatureAuthenticatorClient},
 * {@link DualFactorAuthenticatorClient}, {@link PasswordMinuteSignatureAuthenticatorClient})
 * {@link ApiKeySessionAuthenticatorClient}
 * for both internal SDK use and advanced consumers that want to talk to a single authenticator
 * contract directly.
 *
 * @module clients/auth
 */

import ApiKeySessionAuthenticatorClient from './ApiKeySessionAuthenticatorClient.js';
import AuthenticatorClient from './AuthenticatorClient.js';
import WalletSignatureAuthenticatorClient from './WalletSignatureAuthenticatorClient.js';
import PasswordAuthenticatorClient from './PasswordAuthenticatorClient.js';
import DualFactorAuthenticatorClient from './DualFactorAuthenticatorClient.js';
import PasswordMinuteSignatureAuthenticatorClient from './PasswordMinuteSignatureAuthenticatorClient.js';

export {
  ApiKeySessionAuthenticatorClient,
  AuthenticatorClient,
  WalletSignatureAuthenticatorClient,
  PasswordAuthenticatorClient,
  DualFactorAuthenticatorClient,
  PasswordMinuteSignatureAuthenticatorClient,
};
