/**
 * Auth Package
 * 
 * Exports authenticator clients for authentication operations.
 */

const AuthenticatorClient = require('./AuthenticatorClient');
const WalletSignatureAuthenticatorClient = require('./WalletSignatureAuthenticatorClient');
const PasswordAuthenticatorClient = require('./PasswordAuthenticatorClient');

module.exports = {
  AuthenticatorClient,
  WalletSignatureAuthenticatorClient,
  PasswordAuthenticatorClient
};

