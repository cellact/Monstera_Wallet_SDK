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
import { isAddress, requireString, requireObject, requireChainId } from '../internal/assert.js';
import { getConfigStorageContract } from '../contracts/configStorage.js';
import { createRegistryReadProvider } from '../providers/polygon.js';
import { ConfigError, NetworkError, RegistryError, ValidationError } from '../errors/index.js';

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
 * RPC and chain id from the registry JSON blob (same string as contract entries).
 *
 * @param {string} raw - Non-empty registry JSON string
 * @returns {{ rpcUrl?: string, chainId?: ChainId }} 
 * @throws {RegistryError} If JSON is invalid or the root value is not an object, or {@code chain_id} is present but invalid
 * @throws {ValidationError} If {@code raw} is missing or not a string ({@link requireString}) or the root value is not an object ({@link requireObject})
 */
function parseRegistryConnectionHints(raw) {
  requireString(raw, 'raw');

  let j;
  try {
    j = JSON.parse(raw);
  } catch (e) {
    throw new RegistryError(
      `Registry connection hints: invalid JSON (${e instanceof Error ? e.message : String(e)})`,
      { phase: 'connectionHints' }
    );
  }
  requireObject(j, 'j');

  const rpcUrl =
    j.RPC != null && j.RPC !== ''
      ? typeof j.RPC === 'string'
        ? j.RPC.trim()
        : String(j.RPC)
      : undefined;

  /** @type {ChainId | undefined} */
  let chainId;
  if (j.chain_id != null && j.chain_id !== '') {
    try {
      chainId = requireChainId(j.chain_id, 'chain_id');
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new RegistryError(
          `Registry connection hints: invalid chain_id (${e.message})`,
          { phase: 'connectionHints', gotChainId: j.chain_id }
        );
      }
      throw e;
    }
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
 * @throws {ValidationError} If {@code rawJson} is invalid ({@link requireString}) or the root value is not an object ({@link requireObject})
 */
function parseRegistryContractAddresses(network, rawJson) {
  requireString(rawJson, 'rawJson');

  let data;
  try {
    data = JSON.parse(rawJson);
  } catch (e) {
    throw new RegistryError(
      `Registry contract addresses: invalid JSON (${e instanceof Error ? e.message : String(e)})`,
      { phase: 'parseAddresses', network }
    );
  }
  requireObject(data, 'data');

  /** @type {Partial<ContractAddresses>} */
  const out = {};
  for (const [jsonKey, sdkKey] of Object.entries(REGISTRY_JSON_TO_SDK)) {
    const v = data[jsonKey];
    if (v === undefined || v === null || v === '') {
      continue;
    }
    const addrRaw = typeof v === 'string' ? v.trim() : String(v);
    if (!isAddress(addrRaw)) {
      throw new RegistryError(`Invalid Ethereum address in registry for key "${jsonKey}"`, {
        phase: 'parseAddresses',
        network,
        jsonKey,
        value: v
      });
    }
    out[sdkKey] = ethers.getAddress(addrRaw);
  }
  if (!Object.keys(out).length) {
    throw new RegistryError('Registry JSON contains no contract address entries', {
      phase: 'parseAddresses',
      network
    });
  }
  return out;
}

/**
 * Fetch the raw registry JSON string from ConfigStorage (cached per profile). No parsing.
 *
 * @param {'testnet'|'mainnet'} network
 * @returns {Promise<string>}
 * @throws {ConfigError} When no registry profile exists for this Sapphire preset
 * @throws {RegistryError} When the storage path is missing or the value is empty / not a string
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
    const exists = await storage.hasPath(profile.storagePath);
    if (!exists) {
      log.warn('Remote registry: path not found', { path: profile.storagePath });
      throw new RegistryError(
        `ConfigStorage registry path does not exist: ${profile.storagePath}`,
        { phase: 'fetch', network, path: profile.storagePath }
      );
    }
    const raw = await storage.getValue(profile.storagePath);
    log.debug('raw Registry JSON', raw);
    requireString(raw, 'raw');
    remoteRawCache.set(key, raw);
    log.debug('Remote registry: loaded and cached (raw)', { network });
    return raw;
  } catch (e) {
    if (e instanceof RegistryError || e instanceof ConfigError || e instanceof NetworkError) {
      throw e;
    }
    const cause = e instanceof Error ? e : null;
    throw new NetworkError(
      `Remote registry fetch failed: ${cause?.message ?? String(e)}`,
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
