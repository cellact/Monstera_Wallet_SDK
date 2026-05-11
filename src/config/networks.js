/**
 * Built-in network presets and contract address defaults for Oasis Sapphire.
 *
 * Provides:
 * - {@link NETWORKS}: per-network metadata (name, chain id, default RPC URL, explorer URL)
 * - {@link DEFAULT_ADDRESSES}: SDK-shipped factory + authenticator contract addresses per network
 * - {@link buildNetworkConfig}: pure helper that merges user overrides on top of the presets
 *
 * Consumed by {@code MonsteraConfig.resolveBaseConfig}, which is itself called by the {@code Monstera}
 * facade during {@code connect}. No network I/O happens here — this module is fully static.
 *
 * @typedef {import('../types/index.js').NetworkConfig} NetworkConfig
 * @typedef {import('../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../types/index.js').DefaultContractAddresses} DefaultContractAddresses
 * @typedef {import('../types/index.js').NetworkPresets} NetworkPresets
 * @typedef {import('../types/index.js').BuildNetworkConfigInput} BuildNetworkConfigInput
 *
 * @module config/networks
 */

import { normalizeChainId } from '../internal/utils/normalize.js';

/**
 * Network metadata presets for Sapphire testnet and mainnet.
 *
 * @public
 * @readonly
 * @type {NetworkPresets}
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
 * SDK-shipped contract address defaults for the Monstera deployment on each network.
 *
 * @remarks Users do not need to pass these — they are merged in by {@link buildNetworkConfig}.
 * Per-call {@code addresses} overrides on the connect options take precedence over these defaults
 * and are typically only used for local / staging deployments.
 *
 * @public
 * @readonly
 * @type {DefaultContractAddresses}
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
 * Build a {@link NetworkConfig} from a preset key plus optional overrides.
 *
 * @description Pure function: looks up the preset by {@code network} ({@code "testnet"} or
 * {@code "mainnet"}), merges user-supplied {@code addresses} on top of {@link DEFAULT_ADDRESSES},
 * and applies {@code rpcUrl} / {@code chainId} overrides if provided. The chain id is normalised
 * via {@link normalizeChainId} so callers may pass decimal or {@code 0x}-hex strings.
 *
 * @remarks Does NOT validate that {@code network} is a known preset; an unknown key results in a
 * {@code TypeError} on property access. The {@code MonsteraConfig.resolveBaseConfig} caller
 * computes {@code network} from a boolean and runs {@code validateContractAddresses} afterwards,
 * so end users never reach this branch.
 *
 * @public
 * @param {BuildNetworkConfigInput} config - Preset key and optional RPC / chain id / address overrides
 * @returns {NetworkConfig} Fully resolved network configuration
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
