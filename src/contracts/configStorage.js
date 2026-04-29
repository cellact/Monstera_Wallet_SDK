/**
 * ConfigStorage Contract Interface
 * 
 * Typed contract getter for the ConfigStorage contract
 * 
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').EthersContract} EthersContract
 */

import { ConfigError } from '../errors/index.js';
import { ethers } from 'ethers';
import { CONFIG_STORAGE_ABI } from './abi/configStorage.js';

/**
 * Get ConfigStorage contract instance
 * 
 * @param {EthersProvider} provider - Provider
 * @param {Address} configStorageAddr - ConfigStorage contract address
 * @returns {EthersContract} Contract instance
 */
function getConfigStorageContract(provider, configStorageAddr) {
  if (!configStorageAddr) {
    throw new ConfigError('ConfigStorage address is required', 'configStorageAddr');
  }
  
  return new ethers.Contract(configStorageAddr, CONFIG_STORAGE_ABI, provider);
}

export {
  getConfigStorageContract,
};
