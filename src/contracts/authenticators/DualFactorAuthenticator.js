/**
 * Typed contract getter for the {@code DualFactorAuthenticator} contract.
 *
 * Returns a freshly instantiated ethers {@link EthersContract} bound to either a Sapphire-wrapped
 * signer (for writes) or a plain provider (for reads). Used by {@link ContractRegistry} on every
 * read/write call from {@link DualFactorAuthenticatorClient}.
 *
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 *
 * @module contracts/authenticators/DualFactorAuthenticator
 */

import { ConfigError } from '../../errors/index.js';
import { Contract } from '../../adapters/ethers/index.js';
import { DUAL_FACTOR_AUTHENTICATOR_ABI } from '../abi/authenticators/dualFactorAuthenticator.js';

/**
 * Build a typed ethers {@link EthersContract} for {@code DualFactorAuthenticator} bound to the given signer/provider.
 *
 * @public
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or provider (for reads)
 * @param {Address} dualFactorAuthenticatorAddress - Deployed DualFactorAuthenticator address
 * @returns {EthersContract} Ethers contract instance
 * @throws {ConfigError} If {@code dualFactorAuthenticatorAddress} is empty/missing
 */
function getDualFactorAuthenticatorContract(signerOrProvider, dualFactorAuthenticatorAddress) {
  if (!dualFactorAuthenticatorAddress) {
    throw new ConfigError('Dual factor authenticator address is required', 'dualFactorAuthenticatorAddress');
  }

  return new Contract(dualFactorAuthenticatorAddress, DUAL_FACTOR_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getDualFactorAuthenticatorContract,
};
