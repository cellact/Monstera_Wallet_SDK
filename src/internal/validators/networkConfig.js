/**
 * Validation for resolved {@link NetworkConfig} and contract address maps.
 *
 * @typedef {import('../../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../../types/index.js').RequiredContractAddressKeys} RequiredContractAddressKeys
 */

import { ConfigError, ValidationError } from '../../errors/index.js';
import { isAddress, requireArray } from '../assert.js';

/**
 * Required contract addresses for SDK initialization (ordered keys used by validation and {@link MonsteraConfig.requiredAddresses}).
 *
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
 * @param {Partial<ContractAddresses>} addresses
 * @param {RequiredContractAddressKeys} required
 * @returns {void}
 * @throws {ConfigError} If required addresses are missing
 * @throws {ValidationError} If address format is invalid or {@code required} is not a non-empty array
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

  // Validate address format (basic check)
  for (const [key, address] of Object.entries(addresses)) {
    if (address && !isAddress(address)) {
      throw new ValidationError(`Invalid address format for ${key}: ${address}`, key, address);
    }
  }
}

/**
 * Validates shape of a fully resolved config plus all required contract addresses.
 *
 * @param {NetworkConfig | Record<string, unknown>} config
 * @returns {void}
 * @throws {ConfigError} If required fields or addresses are missing
 * @throws {ValidationError} If an address format is invalid
 */
function assertValidResolvedConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new ConfigError('SDK configuration is required', 'config');
  }
  if (typeof config.rpcUrl !== 'string' || !String(config.rpcUrl).trim()) {
    throw new ConfigError('RPC URL is required', 'rpcUrl');
  }
  if (config.chainId === undefined || config.chainId === null) {
    throw new ConfigError('chainId is required', 'chainId');
  }
  if (typeof config.network !== 'string' || !config.network) {
    throw new ConfigError('network is required', 'network');
  }
  if (!config.addresses || typeof config.addresses !== 'object') {
    throw new ConfigError('contract addresses are required', 'addresses');
  }
  validateContractAddresses(config.addresses, REQUIRED_CONTRACT_ADDRESS_KEYS);
}

export {
  REQUIRED_CONTRACT_ADDRESS_KEYS,
  validateContractAddresses,
  assertValidResolvedConfig,
};
