/**
 * KeyVault Contract Interface
 * 
 * Typed contract getter for the KeyVault contract
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 */

import { ConfigError } from '../../errors/index.js';
import { ethers } from 'ethers';
import { KEYVAULT_ABI } from '../abi/core/keyVault.js';

/**
 * Get keyVault contract instance
 * 
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or Provider (for reads)
 * @param {Address} keyVaultAddr - KeyVault contract address
 * @returns {EthersContract} Contract instance
 */
function getKeyVaultContract(signerOrProvider, keyVaultAddr) {
  if (!keyVaultAddr) {
    throw new ConfigError('KeyVault address is required', 'keyVaultAddr');
  }
  
  return new ethers.Contract(keyVaultAddr, KEYVAULT_ABI, signerOrProvider);
}

export {
  getKeyVaultContract,
};
