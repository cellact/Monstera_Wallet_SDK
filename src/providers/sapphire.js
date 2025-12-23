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
 * Get a wrapped signer for Sapphire encrypted transactions
 * 
 * @param {Object} signer - Ethers signer instance
 * @returns {Object} Wrapped signer with Sapphire encryption
 */
function getWrappedSigner(signer) {
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
 * Get provider for read operations (no wrapper needed)
 * 
 * @param {String} rpcUrl - RPC URL
 * @returns {Object} Ethers provider
 */
function getReadProvider(rpcUrl) {
  return createProvider(rpcUrl);
}

/**
 * Get signer for write operations (with Sapphire wrapper)
 * 
 * @param {String|Object} signerOrProvider - Private key string or Signer/Provider instance
 * @param {String} rpcUrl - RPC URL (required if signerOrProvider is a private key)
 * @returns {Object} Wrapped signer for encrypted transactions
 */
function getWriteSigner(signerOrProvider, rpcUrl) {
  const { ethers } = require('ethers');
  
  let signer;
  
  // If it's a string, treat it as a private key
  if (typeof signerOrProvider === 'string') {
    if (!rpcUrl) {
      throw new ConfigError('RPC URL is required when providing private key as string', 'rpcUrl');
    }
    const provider = createProvider(rpcUrl);
    signer = new ethers.Wallet(signerOrProvider, provider);
  } 
  // If it's already a Signer
  else if (signerOrProvider && typeof signerOrProvider.signMessage === 'function') {
    signer = signerOrProvider;
  }
  // If it's a Provider, create a wallet (this requires a private key)
  else if (signerOrProvider && typeof signerOrProvider.getBlockNumber === 'function') {
    throw new ValidationError(
      'Provider provided but Signer is required for write operations. Provide a private key or Signer instance.',
      'signerOrProvider',
      signerOrProvider
    );
  }
  else {
    throw new ValidationError(
      'Invalid signerOrProvider. Must be a private key string, Signer, or Provider instance.',
      'signerOrProvider',
      signerOrProvider
    );
  }

  // Wrap with Sapphire for encrypted transactions
  return getWrappedSigner(signer);
}

/**
 * Get provider/signer based on operation type
 * 
 * @param {String} operation - 'read' or 'write'
 * @param {String|Object} signerOrProvider - Signer or provider
 * @param {String} rpcUrl - RPC URL
 * @returns {Object} Provider (for read) or wrapped Signer (for write)
 */
function getProviderForOperation(operation, signerOrProvider, rpcUrl) {
  if (operation === 'read') {
    // For reads, we can use a plain provider
    if (typeof signerOrProvider === 'string') {
      return getReadProvider(rpcUrl);
    } else if (signerOrProvider && typeof signerOrProvider.getBlockNumber === 'function') {
      return signerOrProvider;
    } else {
      return getReadProvider(rpcUrl);
    }
  } else if (operation === 'write') {
    // For writes, we need a wrapped signer
    return getWriteSigner(signerOrProvider, rpcUrl);
  } else {
    throw new ValidationError(
      `Invalid operation: ${operation}. Must be 'read' or 'write'`,
      'operation',
      operation
    );
  }
}

module.exports = {
  createProvider,
  getWrappedSigner,
  getReadProvider,
  getWriteSigner,
  getProviderForOperation
};

