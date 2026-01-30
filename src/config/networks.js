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
    factory: '0x99a98ea83F5b62D2F26A72C85459ae6c75b44C2a',
    passwordAuth: '0xc54aDC2B8Dc7b2AF787c8a30945e32CdB1bB2ee7',
    walletSignatureAuth: '0xe31a99416d2E3a807a5e379AFbc2e230bff2Ee9a',
    dualFactorAuth: '0x1cfd73f5D99f78d4F220cc75Af3083d6094ddCAC'
  },
  mainnet: {
    factory: null,
    passwordAuth: null,
    walletSignatureAuth: null,
    dualFactorAuth: null
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
