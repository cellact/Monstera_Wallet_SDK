/**
 * Typed contract getter for the {@code PasswordOrWalletSignatureAuthenticator} contract.
 *
 * Returns a freshly instantiated ethers {@link EthersContract} bound to either a Sapphire-wrapped
 * signer (for writes) or a plain provider (for reads). Used by {@link ContractRegistry} on every
 * read/write call from {@link PasswordOrWalletSignatureAuthenticator}.
 *
 * @module contracts/authenticators/PasswordOrWalletSignatureAuthenticator
 */

import { Contract } from '../../adapters/ethers/index.js';
import { requireConfigAddress } from '../../internal/validators/configAssert.js';
import { PASSWORD_OR_WALLET_SIGNATURE_AUTHENTICATOR_ABI } from '../abi/authenticators/passwordOrWalletSignatureAuthenticator.js';

/**
 * Build a typed ethers {@link EthersContract} for {@code PasswordOrWalletSignatureAuthenticator} bound to the given signer/provider.
 *
 * @public
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or provider (for reads)
 * @param {Address} passwordOrWalletSignatureAuthenticatorAddress - Deployed PasswordOrWalletSignatureAuthenticator address
 * @returns {EthersContract} Ethers contract instance
 * @throws {ConfigError} If {@code passwordOrWalletSignatureAuthenticatorAddress} is empty/missing
 */
function getPasswordOrWalletSignatureAuthenticatorContract(signerOrProvider, passwordOrWalletSignatureAuthenticatorAddress) {
  requireConfigAddress(
    passwordOrWalletSignatureAuthenticatorAddress,
    'passwordOrWalletSignatureAuthenticatorAddress',
    'Password or wallet signature authenticator address is required'
  );

  return new Contract(passwordOrWalletSignatureAuthenticatorAddress, PASSWORD_OR_WALLET_SIGNATURE_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getPasswordOrWalletSignatureAuthenticatorContract,
};
