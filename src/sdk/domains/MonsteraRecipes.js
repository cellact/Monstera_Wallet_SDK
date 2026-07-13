/**
 * Standardized operation recipes for {@link Monstera} domain methods.
 *
 * Mixed onto the prototype before other domain modules so every domain can share
 * the same three call patterns:
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
 * @typedef {import('../../internal/auth/session/AuthenticatorCallPipeline.js').AuthenticatorInvokeOverrides} AuthenticatorInvokeOverrides
 * @typedef {import('../../internal/auth/session/AuthenticatorCallPipeline.js').AuthenticatorInvokeContext} AuthenticatorInvokeContext
 * @typedef {import('../../internal/auth/session/AuthenticatorCallPipeline.js').AuthenticatorEncodeResult} AuthenticatorEncodeResult
 */

/**
 * @typedef {Object} ConfigureAuthenticatorRecipe
 * @property {Address} authenticatorAddr - Built-in authenticator contract address from config
 * @property {ResolveVaultOptionsFlags} [resolveFlags] - Credentials-session merge flags
 * @property {(resolved: Record<string, unknown>) => AuthConfigInputOptions} buildAuthConfigInput - Structured auth config from resolved options
 * @property {(params: { keyVaultAddr: Address; authConfig: Bytes }) => Promise<unknown>} invoke - Client configure call
 */

export const monsteraRecipeMethods = defineDomainMethods({
  /**
   * Recipe 1: vault-authenticated operation (KeyVault signing, vault admin writes).
   *
   * Resolves vault options, encodes an action-bound auth proof, then invokes the client.
   *
   * @private
   * @template T
   * @param {Record<string, unknown>} options
   * @param {(resolved: Record<string, unknown>) => AuthActionInput} buildAction
   * @param {(encoded: EncodeAuthProofOptionsResult) => Promise<T>} invoke
   * @returns {Promise<T>}
   */
  _invokeVaultAuthenticated(options, buildAction, invoke) {
    return this._vaultPipeline.invokeWithAuthProof(options, buildAction, invoke);
  },

  /**
   * Recipe 2a: authenticator-managed write (encode proof + invoke client).
   *
   * @private
   * @template T
   * @param {AuthProofFlowId} flowId
   * @param {Record<string, unknown>} options
   * @param {ResolveVaultOptionsFlags} [flags]
   * @param {(resolved: Record<string, unknown>, authenticatorAddr: Address) => AuthActionInput} buildAction
   * @param {(ctx: AuthenticatorInvokeContext) => Promise<T>} invoke
   * @param {AuthenticatorInvokeOverrides} [overrides]
   * @returns {Promise<T>}
   */
  _invokeAuthenticatorManaged(flowId, options, flags, buildAction, invoke, overrides = {}) {
    return this._authenticatorPipeline.invokeWithAuthProof(
      flowId,
      options,
      flags,
      buildAction,
      invoke,
      overrides
    );
  },

  /**
   * Recipe 2b: authenticator-managed encode-only (proof building, verify probes).
   *
   * @private
   * @param {AuthProofFlowId} flowId
   * @param {Record<string, unknown>} [options]
   * @param {AuthenticatorEncodeConfig} [config]
   * @returns {Promise<AuthenticatorEncodeResult>}
   */
  _encodeAuthenticatorManaged(flowId, options = {}, config = {}) {
    return this._authenticatorPipeline.encodeAuthProof(flowId, options, config);
  },

  /**
   * Recipe 3: configure authenticator (resolve vault options + encode auth config + client invoke).
   *
   * No auth proof is built; the caller supplies structured {@code authConfig} inputs.
   *
   * @private
   * @param {Record<string, unknown>} [options]
   * @param {ConfigureAuthenticatorRecipe} recipe
   * @returns {Promise<unknown>}
   */
  async _configureAuthenticator(options = {}, recipe) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(
      options,
      recipe.resolveFlags ?? {}
    );
    const { authConfig } = this._encodeAuthConfig.encode({
      authConfig: recipe.buildAuthConfigInput(resolved),
      authenticatorAddr: recipe.authenticatorAddr
    });
    return recipe.invoke({ keyVaultAddr: resolved.keyVaultAddr, authConfig });
  }
});
