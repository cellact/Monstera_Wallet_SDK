/**
 * Typed contract getter for the {@code WalletFactory} contract.
 *
 * Returns a freshly instantiated ethers {@link EthersContract} bound to either a Sapphire-wrapped
 * signer (for writes) or a plain provider (for reads). Used by {@link ContractRegistry} on every
 * read/write call.
 *
 * @module contracts/core/walletFactory
 */

import { Contract } from '../../adapters/ethers/index.js';
import { requireConfigAddress } from '../../internal/validators/configAssert.js';
import { WALLET_FACTORY_ABI } from '../abi/core/walletFactory.js';

/**
 * Build a typed ethers {@link EthersContract} for {@code WalletFactory} bound to the given signer/provider.
 *
 * @public
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or provider (for reads)
 * @param {Address} walletFactoryAddress - Deployed WalletFactory contract address
 * @returns {EthersContract} Ethers contract instance
 * @throws {ConfigError} If {@code walletFactoryAddress} is empty/missing
 */
function getWalletFactoryContract(signerOrProvider, walletFactoryAddress) {
  requireConfigAddress(
    walletFactoryAddress,
    'walletFactoryAddress',
    'Wallet factory address is required'
  );

  return new Contract(walletFactoryAddress, WALLET_FACTORY_ABI, signerOrProvider);
}

export {
  getWalletFactoryContract,
};
