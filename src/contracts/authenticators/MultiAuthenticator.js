/**
 * Typed contract getter for the {@code MultiAuthenticator} contract.
 *
 * Returns a freshly instantiated ethers {@link EthersContract} bound to either a Sapphire-wrapped
 * signer (for writes) or a plain provider (for reads). Used by {@link ContractRegistry} on every
 * read/write call from {@link MultiAuthenticator}.
 *
 * @module contracts/authenticators/MultiAuthenticator
 */

import { Contract } from '../../adapters/ethers/index.js';
import { requireConfigAddress } from '../../internal/validators/configAssert.js';
import { MULTI_AUTHENTICATOR_ABI } from '../abi/authenticators/multiAuthenticator.js';

/**
 * Build a typed ethers {@link EthersContract} for {@code MultiAuthenticator} bound to the given signer/provider.
 *
 * @public
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or provider (for reads)
 * @param {Address} multiAuthenticatorAddress - Deployed MultiAuthenticator address
 * @returns {EthersContract} Ethers contract instance
 * @throws {ConfigError} If {@code multiAuthenticatorAddress} is empty/missing
 */
function getMultiAuthenticatorContract(signerOrProvider, multiAuthenticatorAddress) {
  requireConfigAddress(
    multiAuthenticatorAddress,
    'multiAuthenticatorAddress',
    'MultiAuthenticator address is required'
  );

  return new Contract(multiAuthenticatorAddress, MULTI_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getMultiAuthenticatorContract,
};
