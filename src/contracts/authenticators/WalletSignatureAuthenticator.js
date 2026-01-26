/**
 * Wallet Signature Authenticator Contract Interface
 * 
 * Typed contract getter for the WalletSignatureAuthenticator contract
 */

import { ConfigError } from '../../errors/index.js';
import { ethers } from 'ethers';
import { WALLET_SIGNATURE_AUTHENTICATOR_ABI } from '../abi/authenticators/walletSignatureAuthenticator.js';

/**
 * Get wallet signature authenticator contract instance
 * 
 * @param {Object} signerOrProvider - Ethers Signer or Provider
 * @param {String} walletSignatureAuthenticatorAddress - Wallet signature authenticator contract address
 * @returns {Object} Contract instance
 */
function getWalletSignatureAuthenticatorContract(signerOrProvider, walletSignatureAuthenticatorAddress) {
  if (!walletSignatureAuthenticatorAddress) {
    throw new ConfigError('Wallet signature authenticator address is required', 'walletSignatureAuthenticatorAddress');
  }

  return new ethers.Contract(walletSignatureAuthenticatorAddress, WALLET_SIGNATURE_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getWalletSignatureAuthenticatorContract,
};
