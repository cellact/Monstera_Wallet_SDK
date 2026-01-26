/**
 * Network Configuration
 * 
 * Defines network presets for Oasis Sapphire testnet and mainnet
 * with default RPC URLs and contract addresses.
 */

import { ConfigError, ValidationError } from '../errors/index.js';

/**
 * Network configuration presets
 */
const NETWORKS = {
  testnet: {
    name: 'sapphire-testnet',
    chainId: 0x5aff, // 23295
    rpcUrl: 'https://testnet.sapphire.oasis.dev',
    explorerUrl: 'https://testnet.explorer.sapphire.oasis.io'
  },
  mainnet: {
    name: 'sapphire-mainnet',
    chainId: 0x5afe, // 23294
    rpcUrl: 'https://sapphire.oasis.io',
    explorerUrl: 'https://explorer.sapphire.oasis.io'
  }
};

/**
 * Hardcoded contract addresses for Monstera SDK
 * These addresses are built into the SDK - users don't need to provide them.
 */
const DEFAULT_ADDRESSES = {
  testnet: {
    factory: '0x99a98ea83F5b62D2F26A72C85459ae6c75b44C2a',
    passwordAuth: '0xc54aDC2B8Dc7b2AF787c8a30945e32CdB1bB2ee7',
    walletSignatureAuth: '0xe31a99416d2E3a807a5e379AFbc2e230bff2Ee9a'
  },
  mainnet: {
    factory: null,
    passwordAuth: null,
    walletSignatureAuth: null
  }
};

/**
 * Required contract addresses for SDK initialization
 * All of these must be present and valid for the SDK to function.
 */
const REQUIRED_ADDRESSES = ['factory', 'passwordAuth', 'walletSignatureAuth'];

/**
 * Build network configuration from network name
 * 
 * @param {Object} config - Network configuration
 * @param {'testnet'|'mainnet'} config.network - Network name (guaranteed to be valid)
 * @param {String} config.rpcUrl - RPC URL (optional, uses default if not provided)
 * @param {Object} config.addresses - Contract addresses (optional)
 * @returns {Object} Network configuration object
 */
function buildNetworkConfig(config) {
  const { network, rpcUrl, addresses } = config;

  const networkConfig = NETWORKS[network];

  // Merge addresses with defaults
  const mergedAddresses = {
    ...DEFAULT_ADDRESSES[network],
    ...(addresses || {})
  };

  return {
    network: networkConfig.name,
    chainId: networkConfig.chainId,
    rpcUrl: rpcUrl || networkConfig.rpcUrl,
    explorerUrl: networkConfig.explorerUrl,
    addresses: mergedAddresses
  };
}

/**
 * Validate required contract addresses
 * 
 * @param {Object} addresses - Contract addresses to validate
 * @param {Array<String>} required - List of required address keys
 * @throws {Error} If required addresses are missing
 */
function validateAddresses(addresses, required) {
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
    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new ValidationError(`Invalid address format for ${key}: ${address}`, key, address);
    }
  }
}

/**
 * Resolve and validate SDK configuration.
 * 
 * Internal helper: merges network presets + address defaults, validates required addresses,
 * and returns a normalized config object used by the Monstera constructor.
 * 
 * @param {Object} options
 * @param {Boolean} options.mainnet - true for mainnet, false for testnet
 * @throws {Error} If network or required addresses are invalid/missing.
 */
function resolveBaseConfig(options) {
  const { mainnet, rpcUrl, addresses } = options || {};

  if (typeof mainnet !== 'boolean') {
    throw new ConfigError('mainnet is required and must be a boolean (true for mainnet, false for testnet)', 'mainnet');
  }

  // Convert boolean to network string
  const network = mainnet ? 'mainnet' : 'testnet';

  const networkConfig = buildNetworkConfig({ network, rpcUrl, addresses });

  validateAddresses(networkConfig.addresses, REQUIRED_ADDRESSES);

  return networkConfig; // { network, chainId, rpcUrl, explorerUrl, addresses }
}

export {
  NETWORKS,
  DEFAULT_ADDRESSES,
  REQUIRED_ADDRESSES,
  resolveBaseConfig
};
