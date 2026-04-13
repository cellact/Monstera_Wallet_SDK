/**
 * Network Configuration
 * 
 * Defines network presets for Oasis Sapphire testnet and mainnet
 * with default RPC URLs and contract addresses.
 * 
 * @typedef {import('../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../types/index.js').ContractAddresses} ContractAddresses
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
 * Hardcoded contract addresses for Monstera SDK
 * These addresses are built into the SDK - users don't need to provide them.
 */
const DEFAULT_ADDRESSES = {
  testnet: {
    factory: '0xdf5D9880d80Ee8029ce0b675d66734Cd667eEEB3',
    passwordAuth: '0xc3553935efaa9c02cF963bd551eF02b6d09CA1a5',
    walletSignatureAuth: '0xc06E821da811b0735DA5493F1732a25EB7005412',
    dualFactorAuth: '0xCAb1585C37118d066Bc3AD79919B4CAE5cd42BC2',
    passwordMinuteSignatureAuth: '0x151ed065b04583ABB0Ceb21d37C266e41AA3c7E8',
  },
  mainnet: {
    factory: '0x6170CA80482C5B07FA6c829aF6E5Cd8a3FBEef53',
    passwordAuth: '0x9f79F00888DEb2DE3e6C300a8FF6884214378132',
    walletSignatureAuth: '0x4b294756bB7F9DF7f3b8ad3A546246DE68068Af5',
    dualFactorAuth: '0x5422f5b59F816A39587895e6d169d38C2fc1b2E5',
    passwordMinuteSignatureAuth: '0x61D5299c91ff789d5a636A5046576c3c08397644',
  }
};

/**
 * Build network configuration from network name
 * 
 * @param {Record<string, unknown>} config - Network configuration
 * @param {'testnet'|'mainnet'} config.network - Network name (guaranteed to be valid)
 * @param {string} [config.rpcUrl] - RPC URL (optional, uses default if not provided)
 * @param {Partial<ContractAddresses>} [config.addresses] - Contract addresses (optional)
 * @returns {NetworkConfig}
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

export {
  NETWORKS,
  DEFAULT_ADDRESSES,
  buildNetworkConfig
};
