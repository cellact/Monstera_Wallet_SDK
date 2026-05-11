/**
 * Typed contract getter for the {@code WalletLogic} contract (wallet proxy).
 *
 * Returns a freshly instantiated ethers {@link EthersContract} bound to either a Sapphire-wrapped
 * signer (for writes) or a plain provider (for reads). Used by {@link ContractRegistry} on every
 * read/write call.
 *
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 *
 * @module contracts/core/walletLogic
 */

import { ConfigError } from '../../errors/index.js';
import { Contract } from '../../adapters/ethers/index.js';
import { WALLET_LOGIC_ABI } from '../abi/core/walletLogic.js';

/**
 * Build a typed ethers {@link EthersContract} for {@code WalletLogic} bound to the given signer/provider.
 *
 * @public
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or provider (for reads)
 * @param {Address} walletLogicAddress - Deployed WalletLogic proxy address
 * @returns {EthersContract} Ethers contract instance
 * @throws {ConfigError} If {@code walletLogicAddress} is empty/missing
 */
function getWalletLogicContract(signerOrProvider, walletLogicAddress) {
  if (!walletLogicAddress) {
    throw new ConfigError('Wallet logic address is required', 'walletLogicAddress');
  }
  
  return new Contract(walletLogicAddress, WALLET_LOGIC_ABI, signerOrProvider);
}

export {
  getWalletLogicContract,
};
