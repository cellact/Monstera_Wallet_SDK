/**
 * Static SDK configuration container.
 *
 * Centralises a small set of facts that callers (and the {@code Monstera} facade) need before any
 * contracts are wired up:
 * - the running SDK version (read from {@code package.json} in Node, or injected via the
 *   {@code __MONSTERA_VERSION__} build-time global in bundlers)
 * - the built-in network metadata and contract address presets
 * - the canonical list of required {@link ContractAddresses} keys
 * - the resolver that merges user-supplied connect options with those presets and validates them
 *
 * All members are static; this class is never instantiated.
 *
 * @typedef {import('../types/index.js').NetworkPresets} NetworkPresets
 * @typedef {import('../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../types/index.js').DefaultContractAddresses} DefaultContractAddresses
 * @typedef {import('../types/index.js').BaseConnectNetworkOptions} BaseConnectNetworkOptions
 * @typedef {import('../types/index.js').RequiredContractAddressKeys} RequiredContractAddressKeys
 *
 * @module config/monstera
 */

import { DEFAULT_ADDRESSES, NETWORKS, buildNetworkConfig } from './networks.js';
import { requireBoolean } from '../internal/assert.js';
import log from '../internal/logger.js';
import { SENSITIVE_PARAM_NAMES } from '../internal/sanitization/index.js';
import {
  REQUIRED_CONTRACT_ADDRESS_KEYS,
  validateContractAddresses,
} from '../internal/validators/networkConfig.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Static accessor for SDK configuration constants and the connect-time config resolver.
 *
 * @public
 */
class MonsteraConfig {
  /**
   * Resolve the SDK semver version string.
   *
   * @description Prefers the {@code __MONSTERA_VERSION__} global injected at build time (used by
   * browser bundlers); falls back to reading {@code package.json} relative to this module in
   * Node.js. Used by the version-check utility and by error context emitted from the facade.
   *
   * @remarks Catches and warns (in non-production) on any read failure, returning the literal
   * {@code "unknown"} so this getter never throws.
   *
   * @public
   * @static
   * @readonly
   * @returns {string} SDK version string ({@code "unknown"} if it cannot be resolved)
   */
  static get version() {
    // @ts-ignore
    if (typeof __MONSTERA_VERSION__ !== 'undefined') {
      // @ts-ignore
      return __MONSTERA_VERSION__;
    }
    try {
      if (typeof process !== 'undefined' && process?.versions?.node) {
        const packageJson = require('../../package.json');
        return packageJson?.version || 'unknown';
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to load SDK version from package.json:', e.message);
      }
    }
    return 'unknown';
  }
  
  /**
   * Built-in network metadata presets ({@code testnet} and {@code mainnet}).
   *
   * @public
   * @static
   * @readonly
   * @returns {NetworkPresets} Network configuration presets
   */
  static get networks() {
    return NETWORKS;
  }

  /**
   * Built-in contract address defaults shipped with the SDK.
   *
   * @remarks Pure data — no network I/O. Per-network factory + authenticator addresses.
   *
   * @public
   * @static
   * @readonly
   * @returns {DefaultContractAddresses} Static defaults by network
   */
  static get defaultAddresses() {
    return DEFAULT_ADDRESSES;
  }

  /**
   * Ordered list of {@link ContractAddresses} keys that must be present after merging.
   *
   * @description Returned as a fresh array copy so callers cannot mutate the internal constant.
   *
   * @public
   * @static
   * @readonly
   * @returns {RequiredContractAddressKeys} Ordered list of required {@link ContractAddresses} keys
   */
  static get requiredAddresses() {
    return [...REQUIRED_CONTRACT_ADDRESS_KEYS];
  }

  /**
   * Resolve and validate the network/address configuration for a {@code Monstera} instance.
   *
   * @description Used by the {@code Monstera} constructor. Coerces the boolean {@code mainnet}
   * flag to a preset key, runs {@link buildNetworkConfig} to merge presets with caller overrides,
   * and finally validates that every key in {@link REQUIRED_CONTRACT_ADDRESS_KEYS} resolves to a
   * non-empty checksum-able address.
   *
   * @public
   * @static
   * @param {BaseConnectNetworkOptions} options - Connect-time network options ({@code mainnet},
   *   {@code rpcUrl}, {@code chainId}, {@code addresses})
   * @returns {NetworkConfig} Fully merged + validated network configuration
   * @throws {ValidationError} If {@code mainnet} is missing or not a boolean
   *   (raised by {@link requireBoolean})
   * @throws {ConfigError} If {@code addresses} is missing any required key, or any provided
   *   address is not a valid EVM address (raised by {@link validateContractAddresses})
   */
  static resolveBaseConfig(options) {
    const { mainnet, rpcUrl, addresses, chainId } = options || {};

    requireBoolean(mainnet, 'mainnet');

    const network = mainnet ? 'mainnet' : 'testnet';

    const networkConfig = buildNetworkConfig({ network, rpcUrl, chainId, addresses });

    log.debug('resolveBaseConfig', { mainnet, network });

    validateContractAddresses(networkConfig.addresses, REQUIRED_CONTRACT_ADDRESS_KEYS);

    return networkConfig;
  }

  /**
   * Snapshot of parameter names that the sanitizer considers sensitive.
   *
   * @description Returned as a fresh array copy so callers (e.g. tests) cannot mutate the
   * underlying constant. Used to filter secrets out of error context, logs and debug output.
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
