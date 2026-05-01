/**
 * Password Authenticator Contract Interface
 * 
 * Typed contract getter for the PasswordAuthenticator contract
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 */

import { ConfigError } from '../../errors/index.js';
import { Contract } from '../../adapters/ethers/index.js';
import { PASSWORD_AUTHENTICATOR_ABI } from '../abi/authenticators/passwordAuthenticator.js';

/**
 * Get password authenticator contract instance
 * 
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or Provider (for reads)
 * @param {Address} passwordAuthenticatorAddress - Password authenticator contract address
 * @returns {EthersContract} Contract instance
 */
function getPasswordAuthenticatorContract(signerOrProvider, passwordAuthenticatorAddress) {
  if (!passwordAuthenticatorAddress) {
    throw new ConfigError('Password authenticator address is required', 'passwordAuthenticatorAddress');
  }

  return new Contract(passwordAuthenticatorAddress, PASSWORD_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getPasswordAuthenticatorContract,
};
