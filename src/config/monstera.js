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
import { ConfigError, ValidationError } from '../errors/index.js';
import { isAddress, requireArray, requireBoolean } from '../internal/assert.js';
import log from '../internal/logger.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Required contract addresses for SDK initialization
 * All of these must be present and valid for the SDK to function.
 *
 * @type {RequiredContractAddressKeys}
 */
const REQUIRED_ADDRESSES = ['factory', 'passwordAuth', 'walletSignatureAuth', 'dualFactorAuth', 'passwordMinuteSignatureAuth'];

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
   * Default contract addresses for testnet and mainnet
   * @static
   * @readonly
   * @returns {DefaultContractAddresses} Default contract addresses by network
   */
  static get defaultAddresses() {
    return DEFAULT_ADDRESSES;
  }

  /**
   * Required contract addresses for the SDK to function
   * @static
   * @readonly
   * @returns {RequiredContractAddressKeys} Ordered list of required {@link ContractAddresses} keys
   */
  static get requiredAddresses() {
    return REQUIRED_ADDRESSES;
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
    const { mainnet, rpcUrl, addresses } = options || {};

    requireBoolean(mainnet, 'mainnet');

    // Convert boolean to network string
    const network = mainnet ? 'mainnet' : 'testnet';

    const networkConfig = buildNetworkConfig({ network, rpcUrl, addresses });

    log.debug('resolveBaseConfig', { mainnet, network });

    MonsteraConfig._validateAddresses(networkConfig.addresses, REQUIRED_ADDRESSES);

    return networkConfig;
  }

  /**
   * Validate required contract addresses
   * 
   * @private
   * @static
   * @param {Partial<ContractAddresses>} addresses - Contract addresses to validate
   * @param {RequiredContractAddressKeys} required - List of required address keys (non-empty)
   * @throws {ConfigError} If required addresses are missing
   * @throws {ValidationError} If address format is invalid or required is not an array
   */
  static _validateAddresses(addresses, required) {
    requireArray(required, 'required');

    const missing = required.filter(key => !addresses[key]);
    
    if (missing.length > 0) {
      throw new ConfigError(
        `Missing required contract addresses: ${missing.join(', ')}. ` +
        `Please provide addresses in config or set defaults.`,
        missing.join(', ')
      );
    }

    // Validate address format (basic check)
    for (const [key, address] of Object.entries(addresses)) {
      if (address && !isAddress(address)) {
        throw new ValidationError(`Invalid address format for ${key}: ${address}`, key, address);
      }
    }
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
    return [
      'authConfig', 'authProof', 'currentPassword', 'newPasswordHash',
      'seed', 'mnemonic', 'hookData', 'logicData', 'txData', 'data',
      'message', 'hash', 'privateKey', 'password'
    ];
  }
}

export default MonsteraConfig;
