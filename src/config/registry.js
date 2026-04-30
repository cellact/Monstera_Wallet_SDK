/**
 * Remote registry: ConfigStorage on another chain loads Sapphire contract addresses (JSON via eth_call).
 *
 * Layering: {@link fetchRegistryStorageRaw} performs I/O only; {@link parseRegistryContractAddresses}
 * and {@link parseRegistryConnectionHints} interpret the JSON string without additional RPC calls.
 *
 * On failure these functions throw {@link RegistryError}, {@link ConfigError}, {@link NetworkError},
 * or {@link ValidationError} (via {@link requireString}). Callers that need offline fallback should catch those.
 *
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('../types/index.js').ChainId} ChainId
 */

import { ethers } from 'ethers';
import log from '../internal/logger.js';
import { requireString, requireObject, requireChainId, requireAddress } from '../internal/assert.js';
import { getConfigStorageContract } from '../contracts/configStorage.js';
import { createRegistryReadProvider } from '../providers/polygon.js';
import { ConfigError, NetworkError, RegistryError, WalletError } from '../errors/index.js';

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

/** @type {Map<string, string>} */
const remoteRawCache = new Map();

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

/**
 * Parse a registry JSON string and return the root object.
 *
 * @param {string} rawJson
 * @returns {Record<string, unknown>}
 * @throws {RegistryError} If JSON is invalid
 * @throws {ValidationError} If {@code rawJson} is missing or not a non-empty string ({@link requireString}) or the data is not an object ({@link requireObject})
 */
function parseRegistryJson(rawJson) {
  requireString(rawJson, 'rawJson');
  let data;
  try {
    data = JSON.parse(rawJson);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new RegistryError(`Invalid registry JSON (${msg})`);
  }
  requireObject(data, 'data');
  return data;
}

/** @param {unknown} v - Registry {@code RPC} field */
function normalizeRegistryRpcField(v) {
  if (v == null || v === '') {
    return undefined;
  }
  const s = typeof v === 'string' ? v.trim() : String(v);
  return s === '' ? undefined : s;
}

/**
 * RPC and chain id from the registry JSON blob (same string as contract entries).
 * On success at least one of {@code rpcUrl} or {@code chainId} is set; the other may be omitted for partial overrides.
 *
 * @param {string} rawJson - Non-empty registry JSON string
 * @returns {{ rpcUrl?: string, chainId?: ChainId }}
 * @throws {RegistryError} If JSON is invalid, data is empty, or neither {@code RPC} nor {@code chain_id} is usable
 * @throws {ValidationError} If {@code chain_id} is present but not a valid chain id ({@link requireChainId})
 */
function parseRegistryConnectionHints(rawJson) {
  const data = parseRegistryJson(rawJson);

  const rpcUrl = normalizeRegistryRpcField(data.RPC);

  /** @type {ChainId | undefined} */
  let chainId;
  if (data.chain_id != null && data.chain_id !== '') {
    chainId = requireChainId(data.chain_id, 'chain_id');
  }

  if (!rpcUrl && !chainId) {
    throw new RegistryError('No connection hints in registry');
  }

  return { rpcUrl, chainId };
}

/**
 * Parse registry JSON into partial contract addresses (checksum). Chain id for RPC connection comes from
 * {@link parseRegistryConnectionHints}; preset defaults live in {@link ./networks.js}.
 *
 * @param {'testnet'|'mainnet'} network
 * @param {string} rawJson
 * @returns {Partial<ContractAddresses>}
 * @throws {RegistryError} On invalid JSON, invalid address, or no contract keys in JSON
 * @throws {ValidationError} If {@code rawJson} is invalid ({@link requireString}) or the root is not an object ({@link requireObject})
 */
function parseRegistryContractAddresses(network, rawJson) {
  const data = parseRegistryJson(rawJson);

  /** @type {Partial<ContractAddresses>} */
  const out = {};
  for (const [jsonKey, sdkKey] of Object.entries(REGISTRY_JSON_TO_SDK)) {
    const value = data[jsonKey];
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const addr = String(value).trim();

    requireAddress(addr, `${jsonKey} address`);

    out[sdkKey] = ethers.getAddress(addr);
  }

  if (!Object.keys(out).length) {
    throw new RegistryError('No contract addresses found', { phase: 'parseAddresses', network });
  }

  return out;
}

/**
 * Fetch the raw registry JSON string from ConfigStorage (cached per profile). No parsing.
 *
 * @param {'testnet'|'mainnet'} network
 * @returns {Promise<string>}
 * @throws {ConfigError} When no registry profile exists for this Sapphire preset
 * @throws {ValidationError} When the fetched value is empty or not a non-empty string ({@link requireString})
 * @throws {NetworkError} When the RPC read fails
 */
async function fetchRegistryStorageRaw(network) {
  const profile = resolveRegistryProfile(network);
  if (!profile) {
    throw new ConfigError(
      `No ConfigStorage registry profile is configured for Sapphire ${network}.`,
      'registryProfile'
    );
  }

  const key = cacheKey(network, profile);
  if (remoteRawCache.has(key)) {
    log.debug('Remote registry: cache hit (raw)', { network });
    return /** @type {string} */ (remoteRawCache.get(key));
  }

  let provider;
  try {
    provider = createRegistryReadProvider(profile.rpcUrl);
    const storage = getConfigStorageContract(provider, profile.configStorageAddress);
    const raw = await storage.getValue(profile.storagePath);
    requireString(raw, 'raw');
    log.debug('Remote registry: fetched payload', { network, byteLength: raw.length });
    remoteRawCache.set(key, raw);
    log.debug('Remote registry: loaded and cached (raw)', { network });
    return raw;
  } catch (e) {
    if (e instanceof WalletError) {
      throw e;
    }
    const cause = e instanceof Error ? e : null;
    throw new NetworkError(
      `Registry fetch failed: ${cause?.message ?? String(e)}`,
      profile.rpcUrl,
      cause
    );
  } finally {
    try {
      provider?.destroy?.();
    } catch {
      /* ignore */
    }
  }
}

function clearRemoteAddressCache() {
  remoteRawCache.clear();
}

export {
  DEFAULT_REGISTRY_PROFILES,
  resolveRegistryProfile,
  fetchRegistryStorageRaw,
  parseRegistryContractAddresses,
  parseRegistryConnectionHints,
  clearRemoteAddressCache
};
