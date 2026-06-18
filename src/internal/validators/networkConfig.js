/**
 * Validation helpers for the resolved {@link NetworkConfig} and its contract address map.
 *
 * Used by {@code MonsteraConfig.resolveBaseConfig} (during connect) and exported for tests.
 *
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../../types/index.js').RequiredContractAddressKeys} RequiredContractAddressKeys
 *
 * @module internal/validators/networkConfig
 */

import { ConfigError, ValidationError } from '../../errors/index.js';
import { isAddress, requireArray } from '../assert.js';
import {
  requireConfigChainId,
  requireConfigPlainObject,
  requireConfigString
} from './configAssert.js';

/**
 * Ordered list of contract address keys that must resolve before the SDK can be used.
 *
 * @description Single source of truth re-exported by {@link MonsteraConfig.requiredAddresses};
 * also consumed by {@link validateContractAddresses}.
 *
 * @public
 * @readonly
 * @type {RequiredContractAddressKeys}
 */
const REQUIRED_CONTRACT_ADDRESS_KEYS = Object.freeze([
  'factory',
  'passwordAuth',
  'walletSignatureAuth',
  'dualFactorAuth',
  'passwordMinuteSignatureAuth'
]);

/**
 * Assert that a contract address map has every required key and that every value is a valid
 * EVM address.
 *
 * @public
 * @param {Partial<ContractAddresses>} addresses - Address map to validate
 * @param {RequiredContractAddressKeys} required - Ordered list of keys that must be present
 * @returns {void}
 * @throws {ValidationError} If {@code required} is not a non-empty array (raised by
 *   {@link requireArray}) or any present address fails {@link isAddress}
 * @throws {ConfigError} If any key from {@code required} is missing from {@code addresses}
 */
function validateContractAddresses(addresses, required) {
  requireArray(required, 'required');

  const missing = required.filter(key => !addresses[key]);

  if (missing.length > 0) {
    throw new ConfigError(
      `Missing required contract addresses: ${missing.join(', ')}. ` +
        `Please provide addresses in config or set defaults.`,
      missing.join(', ')
    );
  }

  for (const [key, address] of Object.entries(addresses)) {
    if (address && !isAddress(address)) {
      throw new ValidationError(`Invalid address format for ${key}: ${address}`, key, address);
    }
  }
}

/**
 * Assert that a fully resolved {@link NetworkConfig} object is internally consistent.
 *
 * @description Checks the top-level shape ({@code rpcUrl}, {@code chainId}, {@code network},
 * {@code addresses}) and then defers to {@link validateContractAddresses} for the contract
 * address map.
 *
 * @public
 * @param {NetworkConfig | Record<string, unknown>} config - Candidate config object
 * @returns {void}
 * @throws {ConfigError} If {@code config} is missing or any required field
 *   ({@code rpcUrl}, {@code chainId}, {@code network}, {@code addresses}) is absent / wrong type
 * @throws {ValidationError} Forwarded from {@link validateContractAddresses} on bad address format
 */
function assertValidResolvedConfig(config) {
  requireConfigPlainObject(config, 'config', 'SDK configuration is required');
  requireConfigString(config.rpcUrl, 'rpcUrl', 'RPC URL is required');
  requireConfigChainId(config.chainId, 'chainId', {
    missing: 'chainId is required',
    invalid: 'chainId must be a valid chain id'
  });
  requireConfigString(config.network, 'network', 'network is required');
  requireConfigPlainObject(config.addresses, 'addresses', 'contract addresses are required');
  validateContractAddresses(config.addresses, REQUIRED_CONTRACT_ADDRESS_KEYS);
}

export {
  REQUIRED_CONTRACT_ADDRESS_KEYS,
  validateContractAddresses,
  assertValidResolvedConfig,
};
