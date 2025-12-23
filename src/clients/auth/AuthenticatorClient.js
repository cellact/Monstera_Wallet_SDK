/**
 * AuthenticatorClient
 * 
 * Registry/factory for all authenticator clients.
 * Makes it easy to add new authenticator types without modifying the main SDK.
 */

const WalletSignatureAuthenticatorClient = require('./WalletSignatureAuthenticatorClient');
const PasswordAuthenticatorClient = require('./PasswordAuthenticatorClient');
const { ValidationError } = require('../../errors');

class AuthenticatorClient {
  constructor(readProvider, writeSigner, config) {
    this.readProvider = readProvider;
    this.writeSigner = writeSigner;
    this.config = config;

    // Initialize all authenticator clients
    // To add a new authenticator:
    // 1. Create the client class (e.g., BiometricAuthenticatorClient.js)
    // 2. Import it above
    // 3. Add it here: this.newAuthType = new NewAuthenticatorClient(...)
    this.walletSignature = new WalletSignatureAuthenticatorClient(readProvider, writeSigner, config);
    this.password = new PasswordAuthenticatorClient(readProvider, writeSigner, config);
  }

  /**
   * Get a specific authenticator client by type
   * 
   * @param {String} type - Authenticator type ('walletSignature', 'password', etc.)
   * @returns {Object} Authenticator client instance
   */
  getClient(type) {
    if (!this[type]) {
      throw new ValidationError(
        `Authenticator client type '${type}' not found. Available types: ${Object.keys(this).join(', ')}`,
        'type',
        type
      );
    }
    return this[type];
  }

  /**
   * Get all registered authenticator types
   * 
   * @returns {Array<String>} Array of authenticator type names
   */
  getAvailableTypes() {
    return Object.keys(this).filter(key => !['readProvider', 'writeSigner', 'config'].includes(key));
  }
}

module.exports = AuthenticatorClient;

