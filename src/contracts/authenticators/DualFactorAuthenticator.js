/**
 * Typed contract getter for the {@code DualFactorAuthenticator} contract.
 *
 * Returns a freshly instantiated ethers {@link EthersContract} bound to either a Sapphire-wrapped
 * signer (for writes) or a plain provider (for reads). Used by {@link ContractRegistry} on every
 * read/write call from {@link DualFactorAuthenticatorClient}.
 *
 * @module contracts/authenticators/DualFactorAuthenticator
 */

import { Contract } from '../../adapters/ethers/index.js';
import { requireConfigAddress } from '../../internal/validators/configAssert.js';
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
  requireConfigAddress(
    dualFactorAuthenticatorAddress,
    'dualFactorAuthenticatorAddress',
    'Dual factor authenticator address is required'
  );

  return new Contract(dualFactorAuthenticatorAddress, DUAL_FACTOR_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getDualFactorAuthenticatorContract,
};
