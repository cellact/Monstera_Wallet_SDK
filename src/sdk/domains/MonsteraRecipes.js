/**
 * Operation recipes for {@link Monstera} domain methods.
 *
 * These functions are not properties of a Monstera instance. Domain methods
 * import them and pass the instance. An installed app cannot call them.
 *
 * 1. **Vault-authenticated** — {@link invokeVaultAuthenticated}
 * 2. **Authenticator-managed** — {@link invokeAuthenticatorManaged} / {@link encodeAuthenticatorManaged}
 * 3. **Configure** — {@link configureAuthenticator}
 *
 * @module sdk/domains/MonsteraRecipes
 */

import { getSdkInternals } from '../sdkInternals.js';

/**
 * Recipe 1: vault-authenticated operation (KeyVault signing, vault admin writes).
 *
 * @template T
 * @param {Monstera} sdk
 * @param {VaultAuthenticatedCallDescriptor<T>} descriptor
 * @returns {Promise<T>}
 */
export function invokeVaultAuthenticated(sdk, descriptor) {
  const { options = {}, buildAction, invoke } = descriptor;
  return getSdkInternals(sdk).keyVaultAuthPipeline.invokeWithAuthProof(options, buildAction, invoke);
}

/**
 * Recipe 2a: authenticator-managed invoke (encode proof + client call).
 *
 * @template T
 * @param {Monstera} sdk
 * @param {AuthenticatorManagedCallDescriptor<T>} descriptor
 * @returns {Promise<T>}
 */
export function invokeAuthenticatorManaged(sdk, descriptor) {
  const { flowId, options = {}, flags, buildAction, invoke, flowOptions, overrides } = descriptor;
  return getSdkInternals(sdk).explicitAuthPipeline.invokeWithAuthProof(flowId, options, {
    flags,
    buildAction,
    invoke,
    flowOptions,
    overrides
  });
}

/**
 * Recipe 2b: authenticator-managed encode-only (proof building).
 *
 * @param {Monstera} sdk
 * @param {AuthenticatorManagedEncodeDescriptor} descriptor
 * @returns {Promise<AuthenticatorEncodeResult>}
 */
export function encodeAuthenticatorManaged(sdk, descriptor) {
  const { flowId, options = {}, config = {} } = descriptor;
  return getSdkInternals(sdk).explicitAuthPipeline.encodeAuthProof(flowId, options, config);
}

/**
 * Recipe 3: configure authenticator (resolve vault options + encode auth config + client invoke).
 *
 * @param {Monstera} sdk
 * @param {ConfigureAuthenticatorCallDescriptor} descriptor
 * @returns {Promise<unknown>}
 */
export function configureAuthenticator(sdk, descriptor) {
  const { options = {}, ...configureDescriptor } = descriptor;
  return getSdkInternals(sdk).authConfigPipeline.configure(options, configureDescriptor);
}
