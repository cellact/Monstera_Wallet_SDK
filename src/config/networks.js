/**
 * Network Configuration
 * 
 * Defines network presets for Oasis Sapphire testnet and mainnet
 * with default RPC URLs and contract addresses.
 */

const { ConfigError, ValidationError } = require('../errors');

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
 * 
 * To update addresses, modify this file and publish a new SDK version.
 */
const DEFAULT_ADDRESSES = {
  testnet: {
    factory: '0x99a98ea83F5b62D2F26A72C85459ae6c75b44C2a',
    passwordAuth: '0xc54aDC2B8Dc7b2AF787c8a30945e32CdB1bB2ee7',
    walletSignatureAuth: '0xe31a99416d2E3a807a5e379AFbc2e230bff2Ee9a'
  },
  mainnet: {
    // TODO: Set mainnet addresses when deployed
    factory: null,
    passwordAuth: null,
    walletSignatureAuth: null
  }
};

/**
 * Validate network configuration
 * 
 * @param {Object} config - Network configuration
 * @param {String} config.network - Network name ('testnet' or 'mainnet')
 * @param {String} config.rpcUrl - RPC URL (optional, uses default if not provided)
 * @param {Object} config.addresses - Contract addresses (optional)
 * @returns {Object} Validated network configuration
 * @throws {Error} If network is invalid
 */
function validateNetworkConfig(config) {
  if (!config || !config.network) {
    throw new ConfigError('Network configuration is required', 'network');
  }

  const { network, rpcUrl, addresses } = config;

  if (network !== 'testnet' && network !== 'mainnet') {
    throw new ValidationError(
      `Invalid network: ${network}. Must be 'testnet' or 'mainnet'`,
      'network',
      network
    );
  }

  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new ConfigError(`Network configuration not found for: ${network}`, 'network');
  }

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
function validateAddresses(addresses, required = ['factory']) {
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
 * @throws {Error} If network or required addresses are invalid/missing.
 */
function resolveBaseConfig(options) {
  const { network, rpcUrl, addresses } = options || {};

  if (!network) throw new ConfigError('Network is required. Use "testnet" or "mainnet"', 'network');

  const networkConfig = validateNetworkConfig({ network, rpcUrl, addresses });

  validateAddresses(networkConfig.addresses, ['factory', 'passwordAuth', 'walletSignatureAuth']);

  return networkConfig; // { network, chainId, rpcUrl, explorerUrl, addresses }
}


module.exports = {
  NETWORKS,
  DEFAULT_ADDRESSES,
  validateNetworkConfig,
  validateAddresses,
  resolveBaseConfig
};

