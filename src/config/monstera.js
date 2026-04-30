/**
 * Monstera SDK Configuration
 * 
 * Static configuration constants and metadata for the SDK.
 * This module handles:
 * - SDK version reading
 * - SDK-specific configuration constants
 * - SDK configuration resolution
 * 
 * @typedef {import('../types/index.js').NetworkPresets} NetworkPresets
 * @typedef {import('../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../types/index.js').DefaultContractAddresses} DefaultContractAddresses
 * @typedef {import('../types/index.js').BaseConnectNetworkOptions} BaseConnectNetworkOptions
 * @typedef {import('../types/index.js').RequiredContractAddressKeys} RequiredContractAddressKeys
 */

import { DEFAULT_ADDRESSES, NETWORKS, buildNetworkConfig } from './networks.js';
import {
  fetchRegistryStorageRaw,
  parseRegistryContractAddresses,
  parseRegistryConnectionHints
} from './registry.js';
import { requireBoolean } from '../internal/assert.js';
import log from '../internal/logger.js';
import { SENSITIVE_PARAM_NAMES } from '../internal/sensitiveParams.js';
import {
  REQUIRED_CONTRACT_ADDRESS_KEYS,
  validateContractAddresses,
} from '../internal/validators/networkConfig.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Monstera SDK Configuration
 * 
 * Provides static access to SDK configuration constants and metadata.
 */
class MonsteraConfig {
  /**
   * Version of the SDK
   * @static
   * @readonly
   * @returns {string} SDK version string
   */
  static get version() {
    // In browser builds, version is injected at build time
    // @ts-ignore
    if (typeof __MONSTERA_VERSION__ !== 'undefined') {
      // @ts-ignore
      return __MONSTERA_VERSION__;
    }
    // Node.js environment - resolve package.json relative to this module
    try {
      if (typeof process !== 'undefined' && process?.versions?.node) {
        const packageJson = require('../../package.json');
        return packageJson?.version || 'unknown';
      }
    } catch (e) {
      // Log error for debugging (only in development)
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to load SDK version from package.json:', e.message);
      }
    }
    return 'unknown';
  }
  
  /**
   * Network presets for testnet and mainnet
   * @static
   * @readonly
   * @returns {NetworkPresets} Network configuration presets
   */
  static get networks() {
    return NETWORKS;
  }

  /**
   * Built-in contract address defaults shipped with the SDK (no network I/O).
   * For addresses merged with ConfigStorage registry data, use {@link MonsteraConfig.getDefaultAddressesAsync}.
   *
   * @static
   * @readonly
   * @returns {DefaultContractAddresses} Static defaults by network
   */
  static get defaultAddresses() {
    return DEFAULT_ADDRESSES;
  }

  /**
   * Built-in defaults merged with registry payloads from ConfigStorage (when configured per preset).
   * Calls {@link fetchRegistryStorageRaw} and {@link parseRegistryContractAddresses} per preset; failures keep built-in values for that preset.
   *
   * @static
   * @returns {Promise<DefaultContractAddresses>}
   */
  static async getDefaultAddressesAsync() {
    /** @type {DefaultContractAddresses} */
    const merged = {
      testnet: { ...DEFAULT_ADDRESSES.testnet },
      mainnet: { ...DEFAULT_ADDRESSES.mainnet }
    };

    for (const net of /** @type {Array<'testnet'|'mainnet'>} */ (['testnet', 'mainnet'])) {
      try {
        const raw = await fetchRegistryStorageRaw(net);
        const partial = parseRegistryContractAddresses(net, raw);
        merged[net] = { ...merged[net], ...partial };
      } catch (e) {
        log.warn(`Remote registry unavailable for ${net}; using built-in defaults`, {
          message: e instanceof Error ? e.message : String(e)
        });
      }
    }

    return merged;
  }

  /**
   * Required contract addresses for the SDK to function
   * @static
   * @readonly
   * @returns {RequiredContractAddressKeys} Ordered list of required {@link ContractAddresses} keys
   */
  static get requiredAddresses() {
    return [...REQUIRED_CONTRACT_ADDRESS_KEYS];
  }

  /**
   * Resolve and validate SDK configuration.
   * 
   * Internal helper: merges network presets + address defaults, validates required addresses,
   * and returns a normalized config object used by the Monstera constructor.
   * 
   * @param {BaseConnectNetworkOptions} options - Base connect network options
   * @returns {NetworkConfig}
   * @throws {ConfigError} If network or required addresses are invalid/missing
   * @static
   */
  static resolveBaseConfig(options) {
    const { mainnet, rpcUrl, addresses, chainId } = options || {};

    requireBoolean(mainnet, 'mainnet');

    // Convert boolean to network string
    const network = mainnet ? 'mainnet' : 'testnet';

    const networkConfig = buildNetworkConfig({ network, rpcUrl, chainId, addresses });

    log.debug('resolveBaseConfig', { mainnet, network });

    validateContractAddresses(networkConfig.addresses, REQUIRED_CONTRACT_ADDRESS_KEYS);

    return networkConfig;
  }

  /**
   * Like {@link MonsteraConfig.resolveBaseConfig} but merges contract addresses from
   * remote ConfigStorage.
   *
   * @param {BaseConnectNetworkOptions} options - Base connect network options
   * @returns {Promise<NetworkConfig>}
   * @throws {ConfigError} If network or required addresses are invalid/missing
   * @static
   */
  static async resolveBaseConfigAsync(options) {
    const { mainnet, rpcUrl, addresses, chainId } = options || {};

    requireBoolean(mainnet, 'mainnet');

    const network = mainnet ? 'mainnet' : 'testnet';

    /** @type {Record<string, string>} */
    let remotePartial = {};
    let remoteRpcUrl;
    let remoteChainId;

    try {
      const raw = await fetchRegistryStorageRaw(network);
      remotePartial = parseRegistryContractAddresses(network, raw);
      const hints = parseRegistryConnectionHints(raw);
      remoteRpcUrl = hints.rpcUrl;
      remoteChainId = hints.chainId;
    } catch (e) {
      log.warn('Remote registry unavailable; using built-in defaults', {
        message: e instanceof Error ? e.message : String(e)
      });
    }

    log.debug('resolveBaseConfigAsync', { remoteRpcUrl, remoteChainId });

    const networkConfig = buildNetworkConfig({
      network,
      rpcUrl: rpcUrl ?? remoteRpcUrl,
      chainId: chainId ?? remoteChainId,
      addresses: {
        ...remotePartial,
        ...(addresses || {})
      }
    });

    log.debug('resolveBaseConfigAsync', {
      mainnet,
      network,
      remoteLoaded: Object.keys(remotePartial).length > 0
    });

    validateContractAddresses(networkConfig.addresses, REQUIRED_CONTRACT_ADDRESS_KEYS);

    return networkConfig;
  }

  /**
   * Sensitive parameter names that should never appear in error context or logs
   * 
   * These parameters contain secrets, private keys, or other sensitive data
   * that must be filtered from error messages, logs, and debugging output.
   * 
   * @private
   * @static
   * @readonly
   * @returns {string[]} Array of sensitive parameter names
   */
  static get SENSITIVE_PARAMS() {
    return [...SENSITIVE_PARAM_NAMES];
  }
}

export default MonsteraConfig;
