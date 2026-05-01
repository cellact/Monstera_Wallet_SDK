/**
 * Parameter names whose values must never be stored on errors, logs, or debugging output.
 * Single source of truth for {@link MonsteraConfig.SENSITIVE_PARAMS} and {@link ValidationError}.
 */

/** @type {readonly string[]} */
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
  'providedSigner'
]);
