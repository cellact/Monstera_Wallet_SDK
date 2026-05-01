/**
 * Default authenticator addresses and timing for built-in auth-proof helpers on {@link Monstera}.
 *
 * @typedef {import('../../../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 * @typedef {import('../../../types/index.js').CreateAuthProofWalletSignatureOptions} CreateAuthProofWalletSignatureOptions
 * @typedef {import('../../../types/index.js').CreateAuthProofMinuteSignatureOptions} CreateAuthProofMinuteSignatureOptions
 * @typedef {import('../../../types/index.js').CreateAuthProofDualFactorOptions} CreateAuthProofDualFactorOptions
 */

import { nowUnixTimestampSeconds } from '../../utils/time.js';

const DEFAULT_DEADLINE_OFFSET_SEC = 3600;

/**
 * @param {MonsteraConfigOptions} config
 * @param {CreateAuthProofWalletSignatureOptions} options
 * @returns {Pick<CreateAuthProofWalletSignatureOptions, 'signer'|'keyVaultAddr'|'authenticatorAddr'|'deadline'|'chainId'>}
 */
function withWalletSignatureProofDefaults(config, options = {}) {
  const { signer, keyVaultAddr } = options;
  return {
    signer,
    keyVaultAddr,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.walletSignatureAuth,
    deadline: options.deadline ?? nowUnixTimestampSeconds() + DEFAULT_DEADLINE_OFFSET_SEC,
    chainId: options.chainId ?? config.chainId
  };
}

/**
 * @param {MonsteraConfigOptions} config
 * @param {CreateAuthProofMinuteSignatureOptions} options
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
 * @param {MonsteraConfigOptions} config
 * @param {CreateAuthProofDualFactorOptions} options
 */
function withDualFactorProofDefaults(config, options = {}) {
  const { keyVaultAddr, passwordHash, signer } = options;
  return {
    keyVaultAddr,
    passwordHash,
    signer,
    authenticatorAddr: options.authenticatorAddr ?? config.addresses.dualFactorAuth,
    deadline: options.deadline ?? nowUnixTimestampSeconds() + DEFAULT_DEADLINE_OFFSET_SEC,
    chainId: options.chainId ?? config.chainId
  };
}

export { withWalletSignatureProofDefaults, withMinuteSignatureProofDefaults, withDualFactorProofDefaults };
