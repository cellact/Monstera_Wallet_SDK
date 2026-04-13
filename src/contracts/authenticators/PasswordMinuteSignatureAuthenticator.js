/**
 * Password Minute Signature Authenticator Contract Interface
 * 
 * Typed contract getter for the PasswordMinuteSignatureAuthenticator contract
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 */

import { ConfigError } from '../../errors/index.js';
import { ethers } from 'ethers';
import { PASSWORD_MINUTE_SIGNATURE_AUTHENTICATOR_ABI } from '../abi/authenticators/passwordMinuteSignatureAuthenticator.js';

/**
 * Get password minute signature authenticator contract instance
 * 
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or Provider (for reads)
 * @param {Address} passwordMinuteSignatureAuthenticatorAddress - Password minute signature authenticator contract address
 * @returns {EthersContract} Contract instance
 */
function getPasswordMinuteSignatureAuthenticatorContract(signerOrProvider, passwordMinuteSignatureAuthenticatorAddress) {
  if (!passwordMinuteSignatureAuthenticatorAddress) {
    throw new ConfigError('Password minute signature authenticator address is required', 'passwordMinuteSignatureAuthenticatorAddress');
  }

  return new ethers.Contract(passwordMinuteSignatureAuthenticatorAddress, PASSWORD_MINUTE_SIGNATURE_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getPasswordMinuteSignatureAuthenticatorContract,
};
