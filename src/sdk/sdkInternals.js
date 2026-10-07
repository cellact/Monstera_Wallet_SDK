/**
 * Session, encoders, and pipelines for one {@link Monstera} instance.
 *
 * Stored in a WeakMap so they are not properties of the instance. Domain code
 * in this package reads them with {@link getSdkInternals}. The package entry
 * does not export this module.
 *
 * @module sdk/sdkInternals
 */

/**
 * @typedef {object} SdkInternals
 * @property {import('../internal/auth/session/ConnectSession.js').ConnectSession | null} connectSession
 * @property {import('../internal/auth/proof/AuthProofEncoder.js').AuthProofEncoder} authProofEncoder
 * @property {import('../internal/auth/pipelines/KeyVaultAuthPipeline.js').KeyVaultAuthPipeline} keyVaultAuthPipeline
 * @property {import('../internal/auth/pipelines/ExplicitAuthPipeline.js').ExplicitAuthPipeline} explicitAuthPipeline
 * @property {import('../internal/auth/config/AuthConfigEncoder.js').AuthConfigEncoder} authConfigEncoder
 * @property {import('../internal/auth/pipelines/AuthConfigPipeline.js').AuthConfigPipeline} authConfigPipeline
 */

/** @type {WeakMap<object, SdkInternals>} */
const internals = new WeakMap();

/**
 * @param {object} sdk
 * @param {SdkInternals} value
 */
export function setSdkInternals(sdk, value) {
  internals.set(sdk, value);
}

/**
 * @param {object} sdk
 * @returns {SdkInternals}
 */
export function getSdkInternals(sdk) {
  const value = internals.get(sdk);
  if (!value) {
    throw new Error('Monstera internals are missing for this instance');
  }
  return value;
}
