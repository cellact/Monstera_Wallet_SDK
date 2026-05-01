/**
 * Wallet Signature Authenticator Contract Interface
 * 
 * Typed contract getter for the WalletSignatureAuthenticator contract
 * 
 * @typedef {import('../../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersContract} EthersContract
 */

import { ConfigError } from '../../errors/index.js';
import { Contract } from '../../adapters/ethers/index.js';
import { WALLET_SIGNATURE_AUTHENTICATOR_ABI } from '../abi/authenticators/walletSignatureAuthenticator.js';

/**
 * Get wallet signature authenticator contract instance
 * 
 * @param {WrappedEthersSigner | EthersProvider} signerOrProvider - Sapphire-wrapped signer (for writes) or Provider (for reads)
 * @param {Address} walletSignatureAuthenticatorAddress - Wallet signature authenticator contract address
 * @returns {EthersContract} Contract instance
 */
function getWalletSignatureAuthenticatorContract(signerOrProvider, walletSignatureAuthenticatorAddress) {
  if (!walletSignatureAuthenticatorAddress) {
    throw new ConfigError('Wallet signature authenticator address is required', 'walletSignatureAuthenticatorAddress');
  }

  return new Contract(walletSignatureAuthenticatorAddress, WALLET_SIGNATURE_AUTHENTICATOR_ABI, signerOrProvider);
}

export {
  getWalletSignatureAuthenticatorContract,
};
