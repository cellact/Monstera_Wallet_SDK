/**
 * Password Authenticator Contract Interface
 * 
 * Typed contract getter for the PasswordAuthenticator contract
 */

import { ConfigError } from '../../errors/index.js';
import { ethers } from 'ethers';
import { PASSWORD_AUTHENTICATOR_ABI } from '../abi/authenticators/passwordAuthenticator.js';

/**
 * Get password authenticator contract instance
 * 
 * @param {Object} signerOrProvider - Ethers Signer or Provider
 * @param {String} passwordAuthenticatorAddress - Password authenticator contract address
 * @returns {Object} Contract instance
 */
function getPasswordAuthenticatorContract(signerOrProvider, passwordAuthenticatorAddress) {
  if (!passwordAuthenticatorAddress) {
    throw new ConfigError('Password authenticator address is required', 'passwordAuthenticatorAddress');
  }

  return new ethers.Contract(passwordAuthenticatorAddress, PASSWORD_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getPasswordAuthenticatorContract,
};
