/**
 * MonsteraSession domain methods for {@link Monstera}.
 *
 * @module sdk/domains/MonsteraSession
 */

export const monsteraSessionMethods = {
  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Whether this SDK instance has a wrapped write signer and can submit transactions.
   *
   * @public
   * @returns {boolean} {@code true} when a Sapphire-wrapped signer is configured
   */
  hasWriteAccess() {
    return this.writeSigner !== null;
  },

  /**
   * Get the address of the configured write signer.
   *
   * @public
   * @async
   * @returns {Promise<Address|null>} Signer address, or {@code null} when no signer is configured
   * @throws {Error} If the underlying signer's {@code getAddress()} rejects (rare; e.g. hardware-wallet failures)
   */
  async getSignerAddr() {
    if (!this.writeSigner) return null;
    return await this.writeSigner.getAddress();
  },

  /**
   * Whether this SDK instance was connected with end-user credentials.
   *
   * @public
   * @returns {boolean},
   */
  hasCredentials() {
    return this._vaultPipeline.hasCredentials();
  },

  /**
   * Inject {@code walletAddr} from the credentials session when omitted.
   *
   * @private
   * @async
   * @param {Record<string, unknown>} options
   * @returns {Promise<Record<string, unknown>>},
   */
  async _resolveWalletProxyOptions(options = {}) {
    if (options.walletAddr || !this.hasCredentials()) {
      return options;
    }

    return {
      ...options,
      walletAddr: await this._vaultPipeline.getCredentialsSession().getWalletAddr()
    };
  },

  /**
   * Inject {@code walletOrKeyVaultAddr} from resolved {@code keyVaultAddr} when omitted.
   *
   * @private
   * @async
   * @param {Record<string, unknown>} options
   * @returns {Promise<Record<string, unknown>>},
   */
  async _resolveWalletOrKeyVaultScope(options = {}) {
    if (options.walletOrKeyVaultAddr) {
      return options;
    }

    const resolved = await this._vaultPipeline.resolveVaultOptions(options);
    return { ...options, ...resolved, walletOrKeyVaultAddr: resolved.keyVaultAddr };
  },

  /**
   * Merge ApiKeySession call options with connect credentials and SDK config defaults.
   *
   * @private
   * @async
   * @param {Record<string, unknown>} [options={}]
   * @param {import('../internal/auth/session/CredentialsSession.js').ResolveVaultOptionsFlags} [flags]
   * @returns {Promise<Record<string, unknown>>},
   */
  async _resolveApiKeySessionProofOptions(options = {}, flags = { defaultApiKeySecret: true }) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(options, flags);
    return {
      ...resolved,
      chainId: this.config.chainId
    };
  },

  /**
   * Get the wallet proxy address for the connect-time username.
   * 
   * @returns {Promise<Address>} Wallet proxy address
   * @throws {CredentialsRequiredError} If no credentials session is configured
   * @throws {ValidationError} If no wallet is registered for the session username
   * @throws {NetworkError} If factory lookups fail over RPC
   * @throws {WalletError} For other unrecognised failures
   */
  async getSessionWalletAddr() {
    this._vaultPipeline.requireUserAccess('getSessionWalletAddr');
    return this._vaultPipeline.getCredentialsSession().getWalletAddr();
  },

  /**
   * Resolve the cached KeyVault address for the connect-time username.
   *
   * Uses the same {@link CredentialsSession} → {@link WalletFactoryClient#getKeyVaultAddr} path as
   * vault-scoped facade methods ({@link VaultCallPipeline#resolveVaultOptions}).
   *
   * @public
   * @async
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {CredentialsRequiredError} If no credentials session is configured
   * @throws {ValidationError} If no wallet is registered for the session username
   * @throws {NetworkError} If factory lookups fail over RPC
   * @throws {WalletError} For other unrecognised failures
   */
  async getSessionKeyVaultAddr() {
    const { keyVaultAddr } = await this._vaultPipeline.resolveVaultOptions({});
    return keyVaultAddr;
  },

  /**
   * Get a specific authenticator client by type, e.g. {@code 'walletSignature'} or {@code 'password'}.
   *
   * @public
   * @param {string} type - Authenticator type ({@code 'walletSignature'}, {@code 'password'}, {@code 'dualFactor'}, {@code 'passwordMinuteSignature'})
   * @returns {AuthenticatorClientInstance} The matching authenticator client instance
   * @throws {ValidationError} If {@code type} is missing, not a string, or not a registered authenticator type
   */
  getAuthClient(type) {
    return this.auth.getClient(type);
  },

  /**
   * List the authenticator types registered on this SDK instance.
   *
   * @public
   * @returns {string[]} Array of authenticator type names (suitable for {@link Monstera#getAuthClient})
   */
  getAvailableAuthTypes() {
    return this.auth.getAvailableTypes();
  }
};
