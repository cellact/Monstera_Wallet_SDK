/**
 * Typed contract getter for the {@code ApiKeySessionAuthenticator} contract.
 *
 * Returns a freshly instantiated ethers {@link EthersContract} bound to either a Sapphire-wrapped
 * signer (for writes) or a plain provider (for reads). Used by {@link ContractRegistry} on every
 * read/write call from {@link ApiKeySessionAuthenticator}.
 *
 * @module contracts/authenticators/ApiKeySessionAuthenticator
 */

import { Contract } from '../../adapters/ethers/index.js';
import { requireConfigAddress } from '../../internal/validators/configAssert.js';
import { API_KEY_SESSION_AUTHENTICATOR_ABI } from '../abi/authenticators/apiKeySessionAuthenticator.js';

/**
 * Build a typed ethers {@link EthersContract} for {@code ApiKeySessionAuthenticator} bound to the given signer/provider.
 *
 * @public
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or provider (for reads)
 * @param {Address} apiKeySessionAuthenticatorAddress - Deployed ApiKeySessionAuthenticator address
 * @returns {EthersContract} Ethers contract instance
 * @throws {ConfigError} If {@code apiKeySessionAuthenticatorAddress} is empty/missing
 */
function getApiKeySessionAuthenticatorContract(signerOrProvider, apiKeySessionAuthenticatorAddress) {
  requireConfigAddress(
    apiKeySessionAuthenticatorAddress,
    'apiKeySessionAuthenticatorAddress',
    'API key session authenticator address is required'
  );

  return new Contract(apiKeySessionAuthenticatorAddress, API_KEY_SESSION_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getApiKeySessionAuthenticatorContract,
};
