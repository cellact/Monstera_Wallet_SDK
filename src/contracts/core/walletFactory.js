/**
 * Wallet Factory Contract Interface
 * 
 * Typed contract getter for the WalletFactory contract
 */

import { ConfigError } from '../../errors/index.js';
import { ethers } from 'ethers';
import { WALLET_FACTORY_ABI } from '../abi/core/walletFactory.js';

/**
 * Get wallet factory contract instance
 * 
 * @param {Object} signerOrProvider - Ethers Signer or Provider
 * @param {String} walletFactoryAddress - Wallet factory contract address
 * @returns {Object} Contract instance
 */
function getWalletFactoryContract(signerOrProvider, walletFactoryAddress) {
  if (!walletFactoryAddress) {
    throw new ConfigError('Wallet factory address is required', 'walletFactoryAddress');
  }
  
  return new ethers.Contract(walletFactoryAddress, WALLET_FACTORY_ABI, signerOrProvider);
}

export {
  getWalletFactoryContract,
};
