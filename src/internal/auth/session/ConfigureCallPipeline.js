/**
 * Configure call pipeline: session merge → auth config encode → client invoke.
 *
 * Symmetric with {@link VaultCallPipeline} and {@link AuthenticatorCallPipeline} for
 * initial authenticator setup (no auth proof).
 *
 * @typedef {import('./VaultCallPipeline.js').VaultCallPipeline} VaultCallPipeline
 * @typedef {import('../config/EncodeAuthConfig.js').EncodeAuthConfig} EncodeAuthConfig
 * @typedef {import('./CredentialsSession.js').ResolveVaultOptionsFlags} ResolveVaultOptionsFlags
 *
 * @module internal/auth/session/ConfigureCallPipeline
 */

/**
 * @typedef {Object} ConfigureCallDescriptor
 * @property {ResolveVaultOptionsFlags} [resolveFlags]
 * @property {Address} authenticatorAddr
 * @property {(resolved: Record<string, unknown>) => AuthConfigInputOptions} buildAuthConfigInput
 * @property {(params: { keyVaultAddr: Address; authConfig: Bytes }) => Promise<unknown>} invoke
 */

/**
 * @public
 */
export class ConfigureCallPipeline {
  /**
   * @public
   * @param {{ vaultPipeline: VaultCallPipeline; encodeAuthConfig: EncodeAuthConfig }} deps
   */
  constructor({ vaultPipeline, encodeAuthConfig }) {
    this._vaultPipeline = vaultPipeline;
    this._encodeAuthConfig = encodeAuthConfig;
  }

  /**
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}]
   * @param {ConfigureCallDescriptor} descriptor
   * @returns {Promise<unknown>}
   */
  async configure(options = {}, descriptor) {
    const resolved = await this._vaultPipeline.resolveVaultOptions(
      options,
      descriptor.resolveFlags ?? {}
    );
    const { authConfig } = this._encodeAuthConfig.encode({
      authConfig: descriptor.buildAuthConfigInput(resolved),
      authenticatorAddr: descriptor.authenticatorAddr
    });
    return descriptor.invoke({ keyVaultAddr: resolved.keyVaultAddr, authConfig });
  }
}
