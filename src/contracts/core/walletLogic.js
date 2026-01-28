/**
 * Wallet Logic Contract Interface
 * 
 * Typed contract getter for the WalletLogic contract
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 */

import { ConfigError } from '../../errors/index.js';
import { ethers } from 'ethers';
import { WALLET_LOGIC_ABI } from '../abi/core/walletLogic.js';

/**
 * Get wallet logic contract instance
 * 
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or Provider (for reads)
 * @param {Address} walletLogicAddress - Wallet logic contract address
 * @returns {EthersContract} Contract instance
 */
function getWalletLogicContract(signerOrProvider, walletLogicAddress) {
  if (!walletLogicAddress) {
    throw new ConfigError('Wallet logic address is required', 'walletLogicAddress');
  }
  
  return new ethers.Contract(walletLogicAddress, WALLET_LOGIC_ABI, signerOrProvider);
}

export {
  getWalletLogicContract,
};
