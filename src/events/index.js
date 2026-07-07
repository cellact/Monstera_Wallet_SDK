/**
 * Central event registry.
 *
 * Re-exports the per-contract event definition records used by {@link parseEventFromReceipt}
 * to decode logs. Each per-contract module exports a frozen object of
 * {@code { eventName, fieldMapping }} entries — one per ABI event the SDK actually consumes.
 *
 * Public surface:
 * - {@link ApiKeySessionAuthenticatorEvents}
 * - {@link WalletFactoryEvents}
 * - {@link KeyVaultEvents}
 * - {@link WalletSignatureAuthenticatorEvents}
 * - {@link PasswordAuthenticatorEvents}
 * - {@link DualFactorAuthenticatorEvents}
 * - {@link PasswordMinuteSignatureAuthenticatorEvents}
 * - {@link parseEventFromReceipt} — generic decoder used by {@code BaseContractClient.executeWrite}
 *
 * @module events
 */

import ApiKeySessionAuthenticatorEvents from './apiKeySessionAuthenticator.js';
import WalletSignatureAuthenticatorEvents from './walletSignatureAuthenticator.js';
import WalletFactoryEvents from './walletFactory.js';
import PasswordAuthenticatorEvents from './passwordAuthenticator.js';
import KeyVaultEvents from './keyVault.js';
import DualFactorAuthenticatorEvents from './dualFactorAuthenticator.js';
import { parseEventFromReceipt } from './decodeReceipt.js';
import PasswordMinuteSignatureAuthenticatorEvents from './passwordMinuteSignatureAuthenticator.js';

export {
  ApiKeySessionAuthenticatorEvents,
  WalletSignatureAuthenticatorEvents,
  WalletFactoryEvents,
  PasswordAuthenticatorEvents,
  DualFactorAuthenticatorEvents,
  KeyVaultEvents,
  parseEventFromReceipt,
  PasswordMinuteSignatureAuthenticatorEvents,
};
