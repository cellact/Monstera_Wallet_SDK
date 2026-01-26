/**
 * Wallet Logic Contract Interface
 * 
 * Typed contract getter for the WalletLogic contract
 */

import { ConfigError } from '../../errors/index.js';
import { ethers } from 'ethers';
import { WALLET_LOGIC_ABI } from '../abi/core/walletLogic.js';

/**
 * Get wallet logic contract instance
 * 
 * @param {Object} signerOrProvider - Ethers Signer or Provider
 * @param {String} walletLogicAddress - Wallet logic contract address
 * @returns {Object} Contract instance
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
