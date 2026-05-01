/**
 * JSON-RPC provider factory — the only place {@link JsonRpcProvider} is constructed for SDK flows.
 */

import { JsonRpcProvider } from 'ethers';
import { ConfigError } from '../../errors/index.js';
import log from '../../internal/logger.js';

/**
 * Redact RPC URL for logging (hide query params and sensitive parts)
 * @param {string} url - RPC URL
 * @returns {string} Safe string for logs
 */
function redactRpcUrl(url) {
  if (!url || typeof url !== 'string') return '[none]';
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '[invalid]';
  }
}

/**
 * Create a JSON-RPC provider for the given URL (shared entry point for read/write RPC wiring).
 *
 * @param {string} rpcUrl - RPC URL
 * @param {string} [role] - Optional label for logs (e.g. read / write)
 * @returns {import('ethers').JsonRpcProvider}
 */
function createProvider(rpcUrl, role) {
  if (!rpcUrl) {
    throw new ConfigError('RPC URL is required', 'rpcUrl');
  }

  log.debug('createProvider', { rpcUrl: redactRpcUrl(rpcUrl), role });

  return new JsonRpcProvider(rpcUrl);
}

export { JsonRpcProvider, createProvider, redactRpcUrl };
