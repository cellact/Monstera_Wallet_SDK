/**
 * Sapphire Provider Wrapper
 * 
 * Handles provider creation and Sapphire wrapper integration
 * for encrypted transaction support.
 */

const { ConfigError, ValidationError, NetworkError, SapphireRequiredError } = require('../errors');

/**
 * Create a provider for the given RPC URL
 * 
 * @param {String} rpcUrl - RPC URL
 * @returns {Object} Ethers provider instance
 */
function createProvider(rpcUrl) {
  const { ethers } = require('ethers');
  
  if (!rpcUrl) {
    throw new ConfigError('RPC URL is required', 'rpcUrl');
  }

  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Wrap signer for Sapphire encrypted transactions
 * 
 * @param {Object} signer - Ethers signer instance
 * @returns {Object} Wrapped signer with Sapphire encryption
 */
function wrapSigner(signer) {
  try {
    const { wrapEthersSigner } = require('@oasisprotocol/sapphire-ethers-v6');
    return wrapEthersSigner(signer);
  } catch (error) {
    throw new SapphireRequiredError(
      `Failed to wrap signer with Sapphire: ${error.message}. ` +
      `Make sure @oasisprotocol/sapphire-ethers-v6 is installed.`
    );
  }
}

/**
 * Create signer for write operations (with Sapphire wrapper)
 * 
 * @param {String|Object} signer - Private key string or Signer instance
 * @param {String} rpcUrl - RPC URL (required if signer is a private key)
 * @returns {Object} Wrapped signer for encrypted transactions
 */
function createWriteSigner(providedSigner, rpcUrl) {
  const { ethers } = require('ethers');
  
  let signer;
  
  // If it's a string, treat it as a private key
  if (typeof providedSigner === 'string') {
    if (!rpcUrl) {
      throw new ConfigError('RPC URL is required when providing private key as string', 'rpcUrl');
    }
    const provider = createProvider(rpcUrl);
    signer = new ethers.Wallet(providedSigner, provider);
  } 
  // If it's already a Signer
  else if (providedSigner && typeof providedSigner.signMessage === 'function') {
    signer = providedSigner;
  }
  else {
    throw new ValidationError(
      'Invalid signer. Must be a private key string, or a Signer instance.',
      'providedSigner',
      providedSigner
    );
  }

  // Wrap with Sapphire for encrypted transactions
  return wrapSigner(signer);
}

module.exports = {
  createProvider,
  wrapSigner,
  createWriteSigner,
};
