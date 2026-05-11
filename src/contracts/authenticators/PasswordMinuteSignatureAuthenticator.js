/**
 * Typed contract getter for the {@code PasswordMinuteSignatureAuthenticator} contract.
 *
 * Returns a freshly instantiated ethers {@link EthersContract} bound to either a Sapphire-wrapped
 * signer (for writes) or a plain provider (for reads). Used by {@link ContractRegistry} on every
 * read/write call from {@link PasswordMinuteSignatureAuthenticatorClient}.
 *
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 *
 * @module contracts/authenticators/PasswordMinuteSignatureAuthenticator
 */

import { ConfigError } from '../../errors/index.js';
import { Contract } from '../../adapters/ethers/index.js';
import { PASSWORD_MINUTE_SIGNATURE_AUTHENTICATOR_ABI } from '../abi/authenticators/passwordMinuteSignatureAuthenticator.js';

/**
 * Build a typed ethers {@link EthersContract} for {@code PasswordMinuteSignatureAuthenticator} bound to the given signer/provider.
 *
 * @public
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or provider (for reads)
 * @param {Address} passwordMinuteSignatureAuthenticatorAddress - Deployed PasswordMinuteSignatureAuthenticator address
 * @returns {EthersContract} Ethers contract instance
 * @throws {ConfigError} If {@code passwordMinuteSignatureAuthenticatorAddress} is empty/missing
 */
function getPasswordMinuteSignatureAuthenticatorContract(signerOrProvider, passwordMinuteSignatureAuthenticatorAddress) {
  if (!passwordMinuteSignatureAuthenticatorAddress) {
    throw new ConfigError('Password minute signature authenticator address is required', 'passwordMinuteSignatureAuthenticatorAddress');
  }

  return new Contract(passwordMinuteSignatureAuthenticatorAddress, PASSWORD_MINUTE_SIGNATURE_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getPasswordMinuteSignatureAuthenticatorContract,
};
