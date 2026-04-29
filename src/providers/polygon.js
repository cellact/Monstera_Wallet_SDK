/**
 * Plain EVM JSON-RPC providers for registry chains (e.g. Polygon Amoy).
 * Separate from Sapphire providers in {@link module:providers/sapphire}.
 *
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 */

import { ethers } from 'ethers';
import log from '../internal/logger.js';
import { requireString } from '../internal/assert.js';

/**
 * @param {string} rpcUrl - Registry chain RPC URL
 * @returns {EthersProvider}
 */
function createRegistryReadProvider(rpcUrl) {
  requireString(rpcUrl, 'rpcUrl');
  log.debug('createRegistryReadProvider', { rpcUrl });
  return new ethers.JsonRpcProvider(rpcUrl);
}

export { createRegistryReadProvider };
