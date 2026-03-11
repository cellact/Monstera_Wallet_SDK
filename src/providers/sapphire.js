/**
 * Sapphire Provider Wrapper
 * 
 * Handles provider creation and Sapphire wrapper integration
 * for encrypted transaction support.
 * 
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 * @typedef {import('../types/index.js').EthersSigner} EthersSigner
 * @typedef {import('../types/index.js').WrappedEthersSigner} WrappedEthersSigner
 */

import { ConfigError, SapphireRequiredError, ValidationError } from '../errors/index.js';
import { ethers } from 'ethers';
import { wrapEthersSigner } from '@oasisprotocol/sapphire-ethers-v6';
import log from '../internal/logger.js';

/**
 * Redact RPC URL for logging (hide query params and sensitive parts)
 * @param {string} url - RPC URL
 * @returns {string} Safe string for logs
 */
function redactRpcUrl(url) {
  if (!url || typeof url !== 'string') return '[none]';
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '[invalid]';
  }
}

/**
 * Create a provider for the given RPC URL
 *
 * @param {string} rpcUrl - RPC URL
 * @returns {EthersProvider} Ethers provider instance
 */
function createProvider(rpcUrl, role) {
  if (!rpcUrl) {
    throw new ConfigError('RPC URL is required', 'rpcUrl');
  }

  log.debug('createProvider', { rpcUrl: redactRpcUrl(rpcUrl), role });

  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Wrap signer for Sapphire encrypted transactions
 * 
 * @param {EthersSigner} signer - Ethers signer instance
 * @returns {WrappedEthersSigner} Wrapped signer with Sapphire encryption
 */
function wrapSigner(signer) {
  try {
    return wrapEthersSigner(signer);
  } catch (error) {
    log.warn('Failed to wrap signer with Sapphire', { error: error?.message });
    throw new SapphireRequiredError(
      `Failed to wrap signer with Sapphire: ${error.message}. ` +
      `Make sure @oasisprotocol/sapphire-ethers-v6 is installed.`
    );
  }
}

/**
 * Create signer for write operations (with Sapphire wrapper)
 * 
 * @param {string|EthersSigner} signer - Private key string or Signer instance
 * @param {string} rpcUrl - RPC URL (required if signer is a private key)
 * @returns {WrappedEthersSigner} Wrapped signer for encrypted transactions
 */
function createWriteSigner(providedSigner, rpcUrl, role) {
  let signer;
  
  // If it's a string, treat it as a private key
  if (typeof providedSigner === 'string') {
    if (!rpcUrl) {
      throw new ConfigError('RPC URL is required when providing private key as string', 'rpcUrl');
    }
    const provider = createProvider(rpcUrl, role);
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

  log.debug('createWriteSigner', { role: role ?? 'write' });

  // Wrap with Sapphire for encrypted transactions
  return wrapSigner(signer);
}

export {
  createProvider,
  wrapSigner,
  createWriteSigner,
};
