/**
 * Network Configuration
 *
 * Defines network presets for Oasis Sapphire testnet and mainnet
 * with default RPC URLs and contract addresses.
 *
 * @typedef {import('../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../types/index.js').BuildNetworkConfigInput} BuildNetworkConfigInput
 */

import { normalizeChainId } from '../internal/utils/normalize.js';

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
    factory: '0x4971c68f9c783a74D6f3d55aA515231E05375652',
    passwordAuth: '0x461f38fdCD44a92cD0fBE7ba9498903EFd944740',
    walletSignatureAuth: '0xc06E821da811b0735DA5493F1732a25EB7005412',
    dualFactorAuth: '0xCAb1585C37118d066Bc3AD79919B4CAE5cd42BC2',
    passwordMinuteSignatureAuth: '0x151ed065b04583ABB0Ceb21d37C266e41AA3c7E8',
  },
  mainnet: {
    factory: '0x08Ae4eAf21dae5aAe8E03E4189578f09Fb95ED76',
    passwordAuth: '0xFCF80E508787f3a1C6a33f471b8FF7832683fbc2',
    walletSignatureAuth: '0x4b294756bB7F9DF7f3b8ad3A546246DE68068Af5',
    dualFactorAuth: '0x5422f5b59F816A39587895e6d169d38C2fc1b2E5',
    passwordMinuteSignatureAuth: '0x61D5299c91ff789d5a636A5046576c3c08397644',
  }
};

/**
 * Build network configuration from preset key with optional RPC, chain id, and address overrides.
 *
 * @param {BuildNetworkConfigInput} config - Preset key and optional overrides
 * @returns {NetworkConfig}
 */
function buildNetworkConfig(config) {
  const { network, rpcUrl, addresses, chainId } = config;

  const networkConfig = NETWORKS[network];

  const mergedAddresses = {
    ...DEFAULT_ADDRESSES[network],
    ...(addresses || {})
  };

  const resolvedChainId = normalizeChainId(chainId);

  return {
    network: networkConfig.name,
    chainId: resolvedChainId !== undefined ? resolvedChainId : networkConfig.chainId,
    rpcUrl: rpcUrl || networkConfig.rpcUrl,
    explorerUrl: networkConfig.explorerUrl,
    addresses: mergedAddresses
  };
}


export { NETWORKS, DEFAULT_ADDRESSES, buildNetworkConfig };
