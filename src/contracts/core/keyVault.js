/**
 * Typed contract getter for the {@code KeyVault} contract.
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
 * @module contracts/core/keyVault
 */

import { ConfigError } from '../../errors/index.js';
import { Contract } from '../../adapters/ethers/index.js';
import { KEYVAULT_ABI } from '../abi/core/keyVault.js';

/**
 * Build a typed ethers {@link EthersContract} for {@code KeyVault} bound to the given signer/provider.
 *
 * @public
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or provider (for reads)
 * @param {Address} keyVaultAddr - Deployed KeyVault contract address
 * @returns {EthersContract} Ethers contract instance
 * @throws {ConfigError} If {@code keyVaultAddr} is empty/missing
 */
function getKeyVaultContract(signerOrProvider, keyVaultAddr) {
  if (!keyVaultAddr) {
    throw new ConfigError('KeyVault address is required', 'keyVaultAddr');
  }
  
  return new Contract(keyVaultAddr, KEYVAULT_ABI, signerOrProvider);
}

export {
  getKeyVaultContract,
};
