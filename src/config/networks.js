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
    factory: '0x8B7e2310c4582eF9A492035FE867a9f58BcfB696',
    passwordAuth: '0x34d2426BA65b6d782fE570F08658038974F840b8',
    walletSignatureAuth: '0xF283b3A7FE88932968D9278e72A27A35CEBBf5eD',
    dualFactorAuth: '0xBfd22Afcbcf514e3e352372dDDF1526b0c3464D3',
    passwordMinuteSignatureAuth: '0xBb8b2343e34A26432F59ea8A7c857F003b5e3ccc',
  },
  mainnet: {
    factory: '0x19b90486eDbfdD765a2CBcd97aFCd4876A28C220',
    passwordAuth: '0x93c675336372EBb64dA38018bE28d5EA1a8cC26A',
    walletSignatureAuth: '0xC5AAFBC2e3D7D7674cE317AE0A02bF43f2eD2AA9',
    dualFactorAuth: '0xB82D5511e43723A377d6e1d9B52Ec31979e56c97',
    passwordMinuteSignatureAuth: '0x63B0A8E71a91a2Fc4116FAc57B76beAB82d559d3',
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
