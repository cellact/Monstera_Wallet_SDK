/**
 * Typed contract getter for the {@code WalletSignatureAuthenticator} contract.
 *
 * Returns a freshly instantiated ethers {@link EthersContract} bound to either a Sapphire-wrapped
 * signer (for writes) or a plain provider (for reads). Used by {@link ContractRegistry} on every
 * read/write call from {@link WalletSignatureAuthenticatorClient}.
 *
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 *
 * @module contracts/authenticators/WalletSignatureAuthenticator
 */

import { Contract } from '../../adapters/ethers/index.js';
import { requireConfigAddress } from '../../internal/validators/configAssert.js';
import { WALLET_SIGNATURE_AUTHENTICATOR_ABI } from '../abi/authenticators/walletSignatureAuthenticator.js';

/**
 * Build a typed ethers {@link EthersContract} for {@code WalletSignatureAuthenticator} bound to the given signer/provider.
 *
 * @public
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or provider (for reads)
 * @param {Address} walletSignatureAuthenticatorAddress - Deployed WalletSignatureAuthenticator address
 * @returns {EthersContract} Ethers contract instance
 * @throws {ConfigError} If {@code walletSignatureAuthenticatorAddress} is empty/missing
 */
function getWalletSignatureAuthenticatorContract(signerOrProvider, walletSignatureAuthenticatorAddress) {
  requireConfigAddress(
    walletSignatureAuthenticatorAddress,
    'walletSignatureAuthenticatorAddress',
    'Wallet signature authenticator address is required'
  );

  return new Contract(walletSignatureAuthenticatorAddress, WALLET_SIGNATURE_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getWalletSignatureAuthenticatorContract,
};
