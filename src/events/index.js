/**
 * Event Registry
 * 
 * Central registry for all contract events organized by contract
 */
const WalletSignatureAuthenticatorEvents = require('./walletSignatureAuthenticator');
const WalletFactoryEvents = require('./walletFactory');
const PasswordAuthenticatorEvents = require('./passwordAuthenticator');
const KeyVaultEvents = require('./keyVault');

const { parseEventFromReceipt } = require('./decodeReceipt');

module.exports = {
  WalletSignatureAuthenticatorEvents,
  WalletFactoryEvents,
  PasswordAuthenticatorEvents,
  KeyVaultEvents,
  parseEventFromReceipt
};
