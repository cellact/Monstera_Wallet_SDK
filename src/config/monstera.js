/**
 * Monstera SDK Configuration
 * 
 * Static configuration constants and metadata for the SDK.
 * This module handles:
 * - SDK version reading
 * - SDK-specific configuration constants
 * - SDK configuration resolution
 */

import { DEFAULT_ADDRESSES, NETWORKS, buildNetworkConfig } from './networks.js';
import { ConfigError, ValidationError } from '../errors/index.js';
import { isAddress } from '../internal/assert.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

/**
 * Required contract addresses for SDK initialization
 * All of these must be present and valid for the SDK to function.
 */
const REQUIRED_ADDRESSES = ['factory', 'passwordAuth', 'walletSignatureAuth'];

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
   */
  static get version() {
    // In browser builds, version is injected at build time
    // @ts-ignore
    if (typeof __MONSTERA_VERSION__ !== 'undefined') {
      // @ts-ignore
      return __MONSTERA_VERSION__;
    }
    // Node.js environment - read package.json directly
    try {
      if (typeof window === 'undefined' && typeof import.meta !== 'undefined') {
        // Get the directory of this file (src/config/)
        const currentFile = fileURLToPath(import.meta.url);
        const currentDir = dirname(currentFile);
        
        // Resolve to package.json (go up two levels: src/config -> src -> root)
        const packageJsonPath = join(currentDir, '..', '..', 'package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version;
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
   */
  static get networks() {
    return NETWORKS;
  }

  /**
   * Default contract addresses for testnet and mainnet
   * @static
   * @readonly
   */
  static get defaultAddresses() {
    return DEFAULT_ADDRESSES;
  }

  /**
   * Required contract addresses for the SDK to function
   * @static
   * @readonly
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
   * @param {Object} options
   * @param {Boolean} options.mainnet - true for mainnet, false for testnet
   * @param {String} [options.rpcUrl] - Optional custom RPC URL
   * @param {Object} [options.addresses] - Optional contract address overrides
   * @returns {Object} Normalized config object { network, chainId, rpcUrl, explorerUrl, addresses }
   * @throws {ConfigError} If network or required addresses are invalid/missing
   * @static
   */
  static resolveBaseConfig(options) {
    const { mainnet, rpcUrl, addresses } = options || {};

    if (typeof mainnet !== 'boolean') {
      throw new ConfigError('mainnet is required and must be a boolean (true for mainnet, false for testnet)', 'mainnet');
    }

    // Convert boolean to network string
    const network = mainnet ? 'mainnet' : 'testnet';

    const networkConfig = buildNetworkConfig({ network, rpcUrl, addresses });

    MonsteraConfig._validateAddresses(networkConfig.addresses, REQUIRED_ADDRESSES);

    return networkConfig; // { network, chainId, rpcUrl, explorerUrl, addresses }
  }

  /**
   * Validate required contract addresses
   * 
   * @private
   * @static
   * @param {Object} addresses - Contract addresses to validate
   * @param {Array<String>} required - List of required address keys
   * @throws {ConfigError} If required addresses are missing
   * @throws {ValidationError} If address format is invalid
   */
  static _validateAddresses(addresses, required) {
    if (!required || !Array.isArray(required) || required.length === 0) {
      throw new ConfigError('Required addresses list must be a non-empty array', 'required');
    }

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
