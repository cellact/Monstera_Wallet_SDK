/**
 * Default-filling helpers for the public {@code Monstera.createAuthProof*} methods.
 *
 * Each helper takes a partial caller-supplied options bag and fills in any missing fields that
 * have a sensible network-derived default (authenticator address, chain id, deadline). The
 * concrete proof builders downstream then perform full validation.
 *
 * @typedef {import('../../../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 * @typedef {import('../../../types/index.js').CreateAuthProofWalletSignatureOptions} CreateAuthProofWalletSignatureOptions
 * @typedef {import('../../../types/index.js').CreateAuthProofMinuteSignatureOptions} CreateAuthProofMinuteSignatureOptions
 * @typedef {import('../../../types/index.js').CreateAuthProofDualFactorOptions} CreateAuthProofDualFactorOptions
 * @typedef {import('../../../types/index.js').PreparePasswordFlowOptions} PreparePasswordFlowOptions
 *
 * @module internal/auth/proof/proofDefaults
 */

import { nowUnixTimestampSeconds } from '../../utils/time.js';

/**
 * Default {@code deadline} offset (seconds from "now") for proofs that carry one.
 *
 * @public
 * @readonly
 */
const DEFAULT_PROOF_DEADLINE_OFFSET_SEC = 3600;

/**
 * Compute the default proof {@code deadline} ({@code now + DEFAULT_PROOF_DEADLINE_OFFSET_SEC}).
 *
 * @public
 * @returns {number}
 */
function defaultProofDeadline() {
  return nowUnixTimestampSeconds() + DEFAULT_PROOF_DEADLINE_OFFSET_SEC;
}

/**
 * Fill defaults for {@code Monstera.createAuthProofWalletSignature}.
 *
 * @description Defaults the authenticator address to {@code config.addresses.walletSignatureAuth},
 * the chain id to {@code config.chainId}, and the deadline to {@code now + 1h}.
 *
 * @public
 * @param {MonsteraConfigOptions} config - Resolved Monstera config (addresses, chain id)
 * @param {CreateAuthProofWalletSignatureOptions} [options={}] - Caller-supplied options
 * @returns {Required<Pick<CreateAuthProofWalletSignatureOptions, 'authenticatorAddr' | 'deadline' | 'chainId'>> & CreateAuthProofWalletSignatureOptions}
 *   Options with defaults filled
 */
function withWalletSignatureProofDefaults(config, options = {}) {
  const { signer, keyVaultAddr } = options;
  return {
    signer,
    keyVaultAddr,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.walletSignatureAuth,
    deadline: options.deadline ?? defaultProofDeadline(),
    chainId: options.chainId ?? config.chainId
  };
}

/**
 * Fill defaults for {@code Monstera.createAuthProofMinuteSignature}.
 *
 * @description Defaults the authenticator address to
 * {@code config.addresses.passwordMinuteSignatureAuth} and the chain id to {@code config.chainId}.
 *
 * @public
 * @param {MonsteraConfigOptions} config - Resolved Monstera config
 * @param {CreateAuthProofMinuteSignatureOptions} [options={}] - Caller-supplied options
 * @returns {Required<Pick<CreateAuthProofMinuteSignatureOptions, 'authenticatorAddr' | 'chainId'>> & CreateAuthProofMinuteSignatureOptions}
 *   Options with defaults filled
 */
function withMinuteSignatureProofDefaults(config, options = {}) {
  const { keyVaultAddr, passwordHash } = options;
  return {
    keyVaultAddr,
    passwordHash,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.passwordMinuteSignatureAuth,
    chainId: options.chainId ?? config.chainId
  };
}

/**
 * Fill defaults for {@code Monstera.createAuthProofDualFactor}.
 *
 * @description Defaults the authenticator address to {@code config.addresses.dualFactorAuth},
 * the chain id to {@code config.chainId}, and the deadline to {@code now + 1h}.
 *
 * @public
 * @param {MonsteraConfigOptions} config - Resolved Monstera config
 * @param {CreateAuthProofDualFactorOptions} [options={}] - Caller-supplied options
 * @returns {Required<Pick<CreateAuthProofDualFactorOptions, 'authenticatorAddr' | 'deadline' | 'chainId'>> & CreateAuthProofDualFactorOptions}
 *   Options with defaults filled
 */
function withDualFactorProofDefaults(config, options = {}) {
  const { keyVaultAddr, passwordHash, signer } = options;
  return {
    keyVaultAddr,
    passwordHash,
    signer,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.dualFactorAuth,
    deadline: options.deadline ?? defaultProofDeadline(),
    chainId: options.chainId ?? config.chainId
  };
}

/**
 * Fill defaults for password proof flows ({@code isPasswordValid}, {@code updatePassword}, etc.).
 *
 * @description Defaults the authenticator address to {@code config.addresses.passwordAuth} and the chain id to
 * {@code config.chainId}. Pass an explicit {@code authenticatorAddr} when targeting
 * {@code PasswordMinuteSignatureAuthenticator} (or another password-hash authenticator).
 *
 * @public
 * @param {MonsteraConfigOptions} config - Resolved Monstera config
 * @param {PreparePasswordFlowOptions} [options={}] - Caller-supplied options
 * @returns {Required<Pick<PreparePasswordFlowOptions, 'authenticatorAddr' | 'chainId'>> & PreparePasswordFlowOptions}
 *   Options with defaults filled
 */
function withPasswordProofDefaults(config, options = {}) {
  const { keyVaultAddr, password } = options;
  return {
    keyVaultAddr,
    password,
    chainId: options.chainId ?? config.chainId,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.passwordAuth
  };
}

export {
  DEFAULT_PROOF_DEADLINE_OFFSET_SEC,
  defaultProofDeadline,
  withWalletSignatureProofDefaults,
  withMinuteSignatureProofDefaults,
  withDualFactorProofDefaults,
  withPasswordProofDefaults
};
