/**
 * KeyVault Contract Interface
 * 
 * Typed contract getter for the KeyVault contract
 */

import { ConfigError } from '../../errors/index.js';
import { ethers } from 'ethers';
import { KEYVAULT_ABI } from '../abi/core/keyVault.js';
    
/**
 * Get keyVault contract instance
 * 
 * @param {Object} signerOrProvider - Ethers Signer or Provider
 * @param {String} keyVaultAddr - KeyVault contract address
 * @returns {Object} Contract instance
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
    