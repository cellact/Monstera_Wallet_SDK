/**
 * Configure call pipeline: session merge → auth config encode → client invoke.
 *
 * Symmetric with {@link KeyVaultAuthPipeline} and {@link ExplicitAuthPipeline} for
 * initial authenticator setup (no auth proof).
 *
 * @typedef {import('./KeyVaultAuthPipeline.js').KeyVaultAuthPipeline} KeyVaultAuthPipeline
 * @typedef {import('../encoding/AuthConfigEncoder.js').AuthConfigEncoder} AuthConfigEncoder
 * @typedef {import('../session/ConnectSession.js').ResolveVaultOptionsFlags} ResolveVaultOptionsFlags
 *
 * @module internal/auth/pipelines/AuthConfigPipeline
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
export class AuthConfigPipeline {
  /**
   * @public
   * @param {{ keyVaultAuthPipeline: KeyVaultAuthPipeline; authConfigEncoder: AuthConfigEncoder }} deps
   */
  constructor({ keyVaultAuthPipeline, authConfigEncoder }) {
    this._keyVaultAuthPipeline = keyVaultAuthPipeline;
    this._authConfigEncoder = authConfigEncoder;
  }

  /**
   * @public
   * @async
   * @param {Record<string, unknown>} [options={}]
   * @param {ConfigureCallDescriptor} descriptor
   * @returns {Promise<unknown>}
   */
  async configure(options = {}, descriptor) {
    const resolved = await this._keyVaultAuthPipeline.mergeVaultOptions(
      options,
      descriptor.resolveFlags ?? {}
    );
    const { authConfig } = this._authConfigEncoder.encode({
      authConfig: descriptor.buildAuthConfigInput(resolved),
      authenticatorAddr: descriptor.authenticatorAddr
    });
    return descriptor.invoke({ keyVaultAddr: resolved.keyVaultAddr, authConfig });
  }
}
