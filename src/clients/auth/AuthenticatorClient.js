/**
 * AuthenticatorClient
 * 
 * Registry/factory for all authenticator clients.
 * Makes it easy to add new authenticator types without modifying the main SDK.
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').AuthenticatorClientInstance} AuthenticatorClientInstance
 */

import PasswordAuthenticatorClient from './PasswordAuthenticatorClient.js';
import WalletSignatureAuthenticatorClient from './WalletSignatureAuthenticatorClient.js';
import DualFactorAuthenticatorClient from './DualFactorAuthenticatorClient.js';
import { ValidationError } from '../../errors/index.js';

class AuthenticatorClient {
  // ============================================================================
  // Constructor
  // ============================================================================
  
  /**
   * @param {EthersProvider} readProvider - Ethers provider for read operations
   * @param {WrappedEthersSigner | null} writeSigner - Sapphire-wrapped signer for write operations (null for read-only clients)
   * @param {NetworkConfig} config - Configuration object
   */
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
    this.dualFactor = new DualFactorAuthenticatorClient(readProvider, writeSigner, config);
  }

  // ============================================================================
  // Instance Methods
  // ============================================================================

  /**
   * Get a specific authenticator client by type
   * 
   * @param {string} type - Authenticator type ('walletSignature', 'password', etc.)
   * @returns {AuthenticatorClientInstance} Authenticator client instance
   * @throws {ValidationError} If authenticator type is not found
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
   * @returns {string[]} Array of authenticator type names
   */
  getAvailableTypes() {
    return Object.keys(this).filter(key => !['readProvider', 'writeSigner', 'config'].includes(key));
  }
}

export default AuthenticatorClient;
