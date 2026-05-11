/**
 * Typed contract getter for the {@code PasswordAuthenticator} contract.
 *
 * Returns a freshly instantiated ethers {@link EthersContract} bound to either a Sapphire-wrapped
 * signer (for writes) or a plain provider (for reads). Used by {@link ContractRegistry} on every
 * read/write call from {@link PasswordAuthenticatorClient}.
 *
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 *
 * @module contracts/authenticators/PasswordAuthenticator
 */

import { ConfigError } from '../../errors/index.js';
import { Contract } from '../../adapters/ethers/index.js';
import { PASSWORD_AUTHENTICATOR_ABI } from '../abi/authenticators/passwordAuthenticator.js';

/**
 * Build a typed ethers {@link EthersContract} for {@code PasswordAuthenticator} bound to the given signer/provider.
 *
 * @public
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or provider (for reads)
 * @param {Address} passwordAuthenticatorAddress - Deployed PasswordAuthenticator address
 * @returns {EthersContract} Ethers contract instance
 * @throws {ConfigError} If {@code passwordAuthenticatorAddress} is empty/missing
 */
function getPasswordAuthenticatorContract(signerOrProvider, passwordAuthenticatorAddress) {
  if (!passwordAuthenticatorAddress) {
    throw new ConfigError('Password authenticator address is required', 'passwordAuthenticatorAddress');
  }

  return new Contract(passwordAuthenticatorAddress, PASSWORD_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getPasswordAuthenticatorContract,
};
