/**
 * Wallet Factory Contract Interface
 * 
 * Typed contract getter for the WalletFactory contract
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 */

import { ConfigError } from '../../errors/index.js';
import { Contract } from '../../adapters/ethers/index.js';
import { WALLET_FACTORY_ABI } from '../abi/core/walletFactory.js';

/**
 * Get wallet factory contract instance
 * 
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or Provider (for reads) 
 * @param {Address} walletFactoryAddress - Wallet factory contract address
 * @returns {EthersContract} Contract instance 
 */
function getWalletFactoryContract(signerOrProvider, walletFactoryAddress) {
  if (!walletFactoryAddress) {
    throw new ConfigError('Wallet factory address is required', 'walletFactoryAddress');
  }
  
  return new Contract(walletFactoryAddress, WALLET_FACTORY_ABI, signerOrProvider);
}

export {
  getWalletFactoryContract,
};
