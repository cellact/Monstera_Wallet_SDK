/**
 * Event Registry
 * 
 * Central registry for all contract events organized by contract
 */
import WalletSignatureAuthenticatorEvents from './walletSignatureAuthenticator.js';
import WalletFactoryEvents from './walletFactory.js';
import PasswordAuthenticatorEvents from './passwordAuthenticator.js';
import KeyVaultEvents from './keyVault.js';

import { parseEventFromReceipt } from './decodeReceipt.js';

export {
  WalletSignatureAuthenticatorEvents,
  WalletFactoryEvents,
  PasswordAuthenticatorEvents,
  KeyVaultEvents,
  parseEventFromReceipt
};
