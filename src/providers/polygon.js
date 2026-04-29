/**
 * Plain EVM JSON-RPC providers for registry chains (e.g. Polygon Amoy).
 * Separate from Sapphire providers in {@link module:providers/sapphire}.
 *
 * Maps logical registry host names (from ConfigStorage `mainConfig` JSON) to default public RPC URLs.
 *
 * @typedef {import('../types/index.js').EthersProvider} EthersProvider
 */

import { ethers } from 'ethers';
import { ConfigError } from '../errors/index.js';
import log from '../internal/logger.js';

/**
 * Default JSON-RPC URLs for registry reads when `mainConfig.networkName` selects the host chain.
 * Extend this map when adding new supported registry networks.
 *
 * @type {Readonly<Record<string, string>>}
 */
const REGISTRY_NETWORK_DEFAULT_RPC = Object.freeze({
  amoy: 'https://rpc-amoy.polygon.technology',
  polygon: 'https://polygon-rpc.com'
});

/**
 * Normalize registry network labels from mainConfig (case-insensitive aliases).
 *
 * @param {string} name - Value of {@code networkName} from mainConfig JSON
 * @returns {string} Canonical key into {@link REGISTRY_NETWORK_DEFAULT_RPC} or lowercase trim
 */
function normalizeRegistryNetworkName(name) {
  if (name == null || typeof name !== 'string') {
    return '';
  }
  const n = name.trim().toLowerCase();
  if (n === 'matic' || n === 'polygon-mainnet' || n === 'polygon pos' || n === 'polygonpos') {
    return 'polygon';
  }
  return n;
}

/**
 * Default RPC URL for a registry host chain name. Used after reading {@code mainConfig} from ConfigStorage.
 *
 * @param {string} networkName - e.g. {@code amoy}, {@code polygon}
 * @returns {string}
 * @throws {ConfigError} If the SDK has no built-in RPC mapping for this registry network
 */
function getDefaultRegistryRpcUrl(networkName) {
  const key = normalizeRegistryNetworkName(networkName);
  const url = REGISTRY_NETWORK_DEFAULT_RPC[key];
  if (!url) {
    const supported = Object.keys(REGISTRY_NETWORK_DEFAULT_RPC).join(', ');
    throw new ConfigError(
      `ConfigStorage registry host network "${networkName}" is not supported. ` +
        `Supported registry networks: ${supported}. ` +
        `Update mainConfig to a supported network or extend REGISTRY_NETWORK_DEFAULT_RPC in the SDK.`,
      'registryNetworkName'
    );
  }
  return url;
}

/**
 * @param {string} rpcUrl - Registry chain RPC URL
 * @returns {EthersProvider}
 */
function createRegistryReadProvider(rpcUrl) {
  if (!rpcUrl || typeof rpcUrl !== 'string') {
    throw new ConfigError('Registry RPC URL is required', 'rpcUrl');
  }
  log.debug('createRegistryReadProvider', { rpcUrl });
  return new ethers.JsonRpcProvider(rpcUrl);
}

export {
  createRegistryReadProvider,
  getDefaultRegistryRpcUrl,
  normalizeRegistryNetworkName,
  REGISTRY_NETWORK_DEFAULT_RPC
};
