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

/**
 * @typedef {import('../../internal/auth/authenticators/registry.js').AuthProofFlowId} AuthProofFlowId
 * @typedef {import('../../internal/auth/session/CredentialsSession.js').ResolveVaultOptionsFlags} ResolveVaultOptionsFlags
 * @typedef {import('../../internal/auth/session/AuthenticatorCallPipeline.js').AuthenticatorEncodeConfig} AuthenticatorEncodeConfig
 * @typedef {import('../../internal/auth/session/AuthenticatorCallPipeline.js').AuthenticatorInvokeContext} AuthenticatorInvokeContext
 * @typedef {import('../../internal/auth/session/AuthenticatorCallPipeline.js').AuthenticatorEncodeResult} AuthenticatorEncodeResult
 */

/**
 * @template T
 * @typedef {Object} VaultAuthenticatedCallDescriptor
 * @property {Record<string, unknown>} [options]
 * @property {(resolved: Record<string, unknown>) => AuthActionInput} buildAction
 * @property {(encoded: EncodeAuthProofOptionsResult) => Promise<T>} invoke
 */

/**
 * @template T
 * @typedef {Object} AuthenticatorManagedCallDescriptor
 * @property {AuthProofFlowId} flowId
 * @property {Record<string, unknown>} [options]
 * @property {ResolveVaultOptionsFlags} [flags]
 * @property {(resolved: Record<string, unknown>, authenticatorAddr: Address) => AuthActionInput} buildAction
 * @property {(ctx: AuthenticatorInvokeContext) => Promise<T>} invoke
 * @property {import('../../internal/auth/proof/AuthProofPipeline.js').AuthProofFlowOptions} [flowOptions]
 * @property {import('../../internal/auth/session/AuthenticatorCallPipeline.js').AuthenticatorInvokeOverrides} [overrides]
 */

/**
 * @typedef {Object} AuthenticatorManagedEncodeDescriptor
 * @property {AuthProofFlowId} flowId
 * @property {Record<string, unknown>} [options]
 * @property {AuthenticatorEncodeConfig} [config]
 */

/**
 * @typedef {Object} ConfigureAuthenticatorCallDescriptor
 * @property {Record<string, unknown>} [options]
 * @property {Address} authenticatorAddr
 * @property {ResolveVaultOptionsFlags} [resolveFlags]
 * @property {(resolved: Record<string, unknown>) => AuthConfigInputOptions} buildAuthConfigInput
 * @property {(params: { keyVaultAddr: Address; authConfig: Bytes }) => Promise<unknown>} invoke
 */

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
    return this._vaultPipeline.invokeWithAuthProof(options, buildAction, invoke);
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
    return this._authenticatorPipeline.invokeWithAuthProof(flowId, options, {
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
    return this._authenticatorPipeline.encodeAuthProof(flowId, options, config);
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
    return this._configurePipeline.configure(options, configureDescriptor);
  }
});
