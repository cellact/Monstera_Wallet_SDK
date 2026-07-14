/**
 * Standardized operation recipes for {@link Monstera} domain methods.
 *
 * Mixed onto the prototype before other domain modules so every domain can share
 * the same call patterns. Each recipe accepts a single descriptor object.
 *
 * 1. **Vault-authenticated** — {@link Monstera#_invokeVaultAuthenticated}
 * 2. **Authenticator-managed** — {@link Monstera#_invokeAuthenticatorManaged} / {@link Monstera#_encodeAuthenticatorManaged}
 * 3. **Configure** — {@link Monstera#_configureAuthenticator}
 *
 * @module sdk/domains/MonsteraRecipes
 */

import { defineDomainMethods } from './defineDomainMethods.js';

export const monsteraRecipeMethods = defineDomainMethods({
  /**
   * Recipe 1: vault-authenticated operation (KeyVault signing, vault admin writes).
   *
   * @private
   * @template T
   * @param {VaultAuthenticatedCallDescriptor<T>} descriptor
   * @returns {Promise<T>}
   */
  _invokeVaultAuthenticated(descriptor) {
    const { options = {}, buildAction, invoke } = descriptor;
    return this._keyVaultAuthPipeline.invokeWithAuthProof(options, buildAction, invoke);
  },

  /**
   * Recipe 2a: authenticator-managed invoke (encode proof + client call).
   *
   * @private
   * @template T
   * @param {AuthenticatorManagedCallDescriptor<T>} descriptor
   * @returns {Promise<T>}
   */
  _invokeAuthenticatorManaged(descriptor) {
    const { flowId, options = {}, flags, buildAction, invoke, flowOptions, overrides } = descriptor;
    return this._explicitAuthPipeline.invokeWithAuthProof(flowId, options, {
      flags,
      buildAction,
      invoke,
      flowOptions,
      overrides
    });
  },

  /**
   * Recipe 2b: authenticator-managed encode-only (proof building).
   *
   * @private
   * @param {AuthenticatorManagedEncodeDescriptor} descriptor
   * @returns {Promise<AuthenticatorEncodeResult>}
   */
  _encodeAuthenticatorManaged(descriptor) {
    const { flowId, options = {}, config = {} } = descriptor;
    return this._explicitAuthPipeline.encodeAuthProof(flowId, options, config);
  },

  /**
   * Recipe 3: configure authenticator (resolve vault options + encode auth config + client invoke).
   *
   * @private
   * @param {ConfigureAuthenticatorCallDescriptor} descriptor
   * @returns {Promise<unknown>}
   */
  _configureAuthenticator(descriptor) {
    const { options = {}, ...configureDescriptor } = descriptor;
    return this._authConfigPipeline.configure(options, configureDescriptor);
  }
});
