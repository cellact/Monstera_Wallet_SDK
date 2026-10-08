/**
 * MonsteraSession domain methods for {@link Monstera}.
 *
 * @module sdk/domains/MonsteraSession
 */

import { defineDomainMethods } from './defineDomainMethods.js';
import { getSdkInternals } from '../sdkInternals.js';

/**
 * Inject {@code walletAddr} from the credentials session when omitted.
 *
 * @param {Monstera} sdk
 * @param {Record<string, unknown>} [options]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function resolveWalletProxyOptions(sdk, options = {}) {
  if (options.walletAddr || !sdk.hasCredentials()) {
    return options;
  }

  return {
    ...options,
    walletAddr: await getSdkInternals(sdk).keyVaultAuthPipeline.getConnectSession().getWalletAddr()
  };
}

/**
 * Inject {@code walletOrKeyVaultAddr} from resolved {@code keyVaultAddr} when omitted.
 *
 * @param {Monstera} sdk
 * @param {Record<string, unknown>} [options]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function resolveWalletOrKeyVaultScope(sdk, options = {}) {
  if (options.walletOrKeyVaultAddr) {
    return options;
  }

  const resolved = await getSdkInternals(sdk).keyVaultAuthPipeline.mergeVaultOptions(options);
  return { ...options, ...resolved, walletOrKeyVaultAddr: resolved.keyVaultAddr };
}

/**
 * Merge ApiKeySession call options with connect credentials and SDK config defaults.
 *
 * @param {Monstera} sdk
 * @param {Record<string, unknown>} [options]
 * @param {ResolveVaultOptionsFlags} [flags]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function resolveApiKeySessionProofOptions(sdk, options = {}, flags = { defaultApiKeySecret: true }) {
  const resolved = await getSdkInternals(sdk).keyVaultAuthPipeline.mergeVaultOptions(options, flags);
  return {
    ...resolved,
    chainId: sdk.config.chainId
  };
}

export const monsteraSessionMethods = defineDomainMethods({
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
    return getSdkInternals(this).keyVaultAuthPipeline.hasCredentials();
  },

  /**
   * Get the wallet proxy address for the connect-time username.
   * 
   * @returns {Promise<Address>} Wallet proxy address
   * @throws {CredentialsRequiredError} If no credentials session is configured
   * @throws {ValidationError} If no wallet is registered for the session username
   */
  async getSessionWalletAddr() {
    getSdkInternals(this).keyVaultAuthPipeline.requireUserAccess('getSessionWalletAddr');
    return getSdkInternals(this).keyVaultAuthPipeline.getConnectSession().getWalletAddr();
  },

  /**
   * Resolve the cached KeyVault address for the connect-time username.
   *
   * @public
   * @async
   * @returns {Promise<Address>} KeyVault contract address
   * @throws {CredentialsRequiredError} If no credentials session is configured
   * @throws {ValidationError} If no wallet is registered for the session username
   */
  async getSessionKeyVaultAddr() {
    const { keyVaultAddr } = await getSdkInternals(this).keyVaultAuthPipeline.mergeVaultOptions({});
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
});
