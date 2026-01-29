/**
 * Dual Factor Authenticator Contract Interface
 * 
 * Typed contract getter for the DualFactorAuthenticator contract
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 */

import { ConfigError } from '../../errors/index.js';
import { ethers } from 'ethers';
import { DUAL_FACTOR_AUTHENTICATOR_ABI } from '../abi/authenticators/dualFactorAuthenticator.js';

/**
 * Get dual factor authenticator contract instance
 * 
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or Provider (for reads)
 * @param {Address} dualFactorAuthenticatorAddress - Dual factor authenticator contract address
 * @returns {EthersContract} Contract instance
 */
function getDualFactorAuthenticatorContract(signerOrProvider, dualFactorAuthenticatorAddress) {
  if (!dualFactorAuthenticatorAddress) {
    throw new ConfigError('Dual factor authenticator address is required', 'dualFactorAuthenticatorAddress');
  }

  return new ethers.Contract(dualFactorAuthenticatorAddress, DUAL_FACTOR_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getDualFactorAuthenticatorContract,
};
