/**
 * Network Configuration
 * 
 * Defines network presets for Oasis Sapphire testnet and mainnet
 * with default RPC URLs and contract addresses.
 */

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
 * Default contract addresses (can be overridden)
 * These should be set after deployment
 */
const DEFAULT_ADDRESSES = {
  testnet: {
    factory: '0xBaa3349BB53dcAa73Ed9eF80757e55Fb501eC53f', // Set after deployment
    beacon: '0x87af76c76FABc07CE9205f20A99301b5a214B6Ae',
    logic: '0x8629E753175106F5aD097B5c65D5F306B3dfdb80',
    keyVaultImpl: '0x225073e1414750F7a975D85797A31095917EE169',
    wallet: '0x76a80aF9eba04529fCedd823e9712a79B98D5D1A',   // Set after deployment
    storage: null,  // Set after deployment
    passwordAuth: '0x0d0E1714A90bfb471d3f85358FfF2b57b53125e6', // Set after deployment
    walletSignatureAuth: '0x5eDF7FBFEE84DC2Ec92c7113D369f3E9450c3Ba4' // Set after deployment
  },
  mainnet: {
    factory: null,
    beacon: null,
    logic: null,
    keyVaultImpl: null,
    wallet: null,
    storage: null,
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
    throw new Error('Network configuration is required');
  }

  const { network, rpcUrl, addresses } = config;

  if (network !== 'testnet' && network !== 'mainnet') {
    throw new Error(`Invalid network: ${network}. Must be 'testnet' or 'mainnet'`);
  }

  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Network configuration not found for: ${network}`);
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
    throw new Error(
      `Missing required contract addresses: ${missing.join(', ')}. ` +
      `Please provide addresses in config or set defaults.`
    );
  }

  // Validate address format (basic check)
  for (const [key, address] of Object.entries(addresses)) {
    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error(`Invalid address format for ${key}: ${address}`);
    }
  }
}

/**
 * Create SDK configuration
 * 
 * @param {Object} options - Configuration options
 * @param {'testnet'|'mainnet'} options.network - Network to use
 * @param {String} [options.rpcUrl] - Custom RPC URL (optional)
 * @param {Object} [options.addresses] - Contract addresses (optional, overrides defaults)
 * @param {String|Object} options.signerOrProvider - Signer or provider for transactions
 * @returns {Object} Validated SDK configuration
 */
function createSdkConfig(options) {
  const { network, rpcUrl, addresses, signerOrProvider } = options;

  if (!network) {
    throw new Error('Network is required. Use "testnet" or "mainnet"');
  }

  if (!signerOrProvider) {
    throw new Error('signerOrProvider is required (ethers Signer or Provider)');
  }

  const networkConfig = validateNetworkConfig({
    network,
    rpcUrl,
    addresses
  });

  // Validate required addresses based on what operations will be performed
  // For now, factory is required for createWallet
  validateAddresses(networkConfig.addresses, ['factory']);

  return {
    ...networkConfig,
    signerOrProvider
  };
}

module.exports = {
  NETWORKS,
  DEFAULT_ADDRESSES,
  validateNetworkConfig,
  validateAddresses,
  createSdkConfig
};

