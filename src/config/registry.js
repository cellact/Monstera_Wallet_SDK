/**
 * Remote registry: ConfigStorage on another chain loads Sapphire contract addresses (JSON via eth_call).
 *
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').ContractAddresses} ContractAddresses
 */

import { ethers } from 'ethers';
import log from '../internal/logger.js';
import { isAddress } from '../internal/assert.js';
import { getConfigStorageContract } from '../contracts/configStorage.js';
import { createRegistryReadProvider } from '../providers/polygon.js';
import { NETWORKS } from './networks.js';

/**
 * @typedef {Object} RegistryProfile
 * @property {string} rpcUrl - JSON-RPC URL for the chain where ConfigStorage is deployed
 * @property {Address} configStorageAddress - ConfigStorage contract address
 * @property {string} storagePath - Full path passed to getValue
 */

/**
 * Built-in defaults: Polygon Amoy for Sapphire testnet; mainnet remote registry disabled until deployed.
 *
 * @type {Record<'testnet'|'mainnet', RegistryProfile | null>}
 */
const DEFAULT_REGISTRY_PROFILES = {
  testnet: {
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    configStorageAddress: '0xa716Ba69292851Dd6E12DD78beAA1650B4C04Faf',
    storagePath:
      'blockchain_configuration_data/monstera/smart_contracts_addresses/test/sapphire'
  },
  mainnet: null
};

/** Remote JSON keys → {@link ContractAddresses} keys */
const REGISTRY_JSON_TO_SDK = {
  WalletFactory: 'factory',
  PasswordAuth: 'passwordAuth',
  WalletSignatureAuth: 'walletSignatureAuth',
  DualFactorAuth: 'dualFactorAuth',
  PasswordMinuteSignatureAuth: 'passwordMinuteSignatureAuth'
};

/** @type {Map<string, { raw: string; parsed: Partial<ContractAddresses> | null }>} */
const remoteCache = new Map();

/**
 * @param {'testnet'|'mainnet'} network
 * @returns {RegistryProfile | null}
 */
function resolveRegistryProfile(network) {
  return DEFAULT_REGISTRY_PROFILES[network] ?? null;
}

/**
 * @param {'testnet'|'mainnet'} network
 * @param {RegistryProfile} profile
 */
function cacheKey(network, profile) {
  return [network, profile.rpcUrl, profile.configStorageAddress, profile.storagePath].join('|');
}

/** @param {unknown} chainId */
function toBigIntChainId(chainId) {
  if (typeof chainId === 'bigint') return chainId;
  if (typeof chainId === 'number') return BigInt(chainId);
  if (typeof chainId === 'string') {
    return chainId.startsWith('0x') ? BigInt(chainId) : BigInt(chainId);
  }
  return BigInt(String(chainId));
}

/**
 * @param {unknown} expected - Sapphire chainId from NETWORKS preset
 * @param {unknown} fromJson - chain_id from registry JSON
 */
function sapphireChainIdMatches(expected, fromJson) {
  if (fromJson === undefined || fromJson === null || fromJson === '') {
    return true;
  }
  try {
    return toBigIntChainId(expected) === toBigIntChainId(fromJson);
  } catch {
    return false;
  }
}

/**
 * Parse registry JSON into partial contract addresses (checksum addresses). Validates optional chain_id.
 *
 * @param {'testnet'|'mainnet'} network
 * @param {string} rawJson
 * @returns {Partial<ContractAddresses>|null}
 */
function parseRegistryJson(network, rawJson) {
  let data;
  try {
    data = JSON.parse(rawJson);
  } catch (e) {
    log.warn('Remote registry: invalid JSON', { message: e?.message });
    return null;
  }
  if (!data || typeof data !== 'object') {
    return null;
  }

  const presetChainId = NETWORKS[network].chainId;
  if (!sapphireChainIdMatches(presetChainId, data.chain_id)) {
    log.warn('Remote registry: chain_id mismatch; ignoring remote bundle', {
      expected: String(presetChainId),
      got: data.chain_id
    });
    return null;
  }

  /** @type {Partial<ContractAddresses>} */
  const out = {};
  for (const [jsonKey, sdkKey] of Object.entries(REGISTRY_JSON_TO_SDK)) {
    const v = data[jsonKey];
    if (v === undefined || v === null || v === '') {
      continue;
    }
    const raw = typeof v === 'string' ? v.trim() : String(v);
    if (!isAddress(raw)) {
      log.warn('Remote registry: invalid address for key', { key: jsonKey, value: v });
      return null;
    }
    out[sdkKey] = ethers.getAddress(raw);
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Fetch contract addresses from ConfigStorage (cached per profile).
 *
 * @param {'testnet'|'mainnet'} network
 * @returns {Promise<{ raw: string; parsed: Partial<ContractAddresses>|null }|null>}
 */
async function fetchContractAddressesFromRegistry(network) {
  const profile = resolveRegistryProfile(network);
  if (!profile) {
    log.debug('Remote registry: no profile for preset', { network });
    return null;
  }

  const key = cacheKey(network, profile);
  if (remoteCache.has(key)) {
    log.debug('Remote registry: cache hit', { network });
    return remoteCache.get(key);
  }

  let provider;
  try {
    provider = createRegistryReadProvider(profile.rpcUrl);
    const storage = getConfigStorageContract(provider, profile.configStorageAddress);
    const exists = await storage.hasPath(profile.storagePath);
    if (!exists) {
      log.warn('Remote registry: path not found', { path: profile.storagePath });
      return null;
    }
    const raw = await storage.getValue(profile.storagePath);
    log.debug('raw Registry JSON', raw);
    if (!raw || typeof raw !== 'string') {
      log.warn('Remote registry: empty value');
      return null;
    }
    const parsed = parseRegistryJson(network, raw);
    log.debug('parsed Registry JSON', parsed);
    const bundle = { raw, parsed };
    remoteCache.set(key, bundle);
    if (parsed) {
      log.debug('Remote registry: loaded and cached', { network });
    }
    return bundle;
  } catch (e) {
    log.warn('Remote registry: fetch failed, using built-in defaults', { message: e?.message });
    return null;
  } finally {
    try {
      provider?.destroy?.();
    } catch {
      /* ignore */
    }
  }
}

function clearRemoteAddressCache() {
  remoteCache.clear();
}

export {
  DEFAULT_REGISTRY_PROFILES,
  resolveRegistryProfile,
  fetchContractAddressesFromRegistry,
  clearRemoteAddressCache,
  parseRegistryJson
};
