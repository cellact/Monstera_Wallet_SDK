/**
 * Single source of truth for parameter names whose values must NEVER appear verbatim in errors,
 * logs, or debug output.
 *
 * Re-exported by {@link MonsteraConfig.SENSITIVE_PARAMS}; consumed directly by {@link Sanitizer}
 * (for log / error / encoder-error redaction) and {@link ValidationError} (so error
 * {@code context.value} on validation failures is redacted at construction time).
 *
 * @module internal/sanitization/SensitiveParams
 */

/**
 * Frozen list of sensitive parameter names.
 *
 * @public
 * @readonly
 * @type {readonly string[]}
 */
export const SENSITIVE_PARAM_NAMES = Object.freeze([
  'accessToken',
  'authConfig',
  'authProof',
  'baseChainCode',
  'basePrivateKey',
  'currentPassword',
  'digest',
  'newPasswordHash',
  'passwordHash',
  'seed',
  'mnemonic',
  'newAuthConfig',
  'hookData',
  'implCall',
  'logicData',
  'txData',
  'data',
  'message',
  'hash',
  'privateKey',
  'password',
  'providedSigner',
  'apiKey',
  'apiKeySecret',
  'newApiKeySecret'
]);
