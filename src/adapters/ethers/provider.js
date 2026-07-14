/**
 * JSON-RPC provider factory and URL redactor.
 *
 * The single place in the SDK where {@link JsonRpcProvider} is constructed for read flows. The
 * Sapphire write provider is built separately in {@code src/providers/sapphire.js} but ultimately
 * reuses the same {@code ethers} import surface.
 *
 * @module adapters/ethers/provider
 */

import { JsonRpcProvider } from 'ethers';
import log from '../../internal/logger.js';
import { requireConfigString } from '../../internal/validators/configAssert.js';

/**
 * Redact an RPC URL down to {@code protocol://host} for safe logging.
 *
 * @description Strips any path, query string, user-info, or fragment so API keys / tokens that are
 * occasionally passed via URL never end up in logs. Returns a sentinel string for empty / malformed
 * input rather than throwing — this helper is called from log lines and must never reject.
 *
 * @public
 * @param {string} url - RPC URL (may be empty / non-string / invalid)
 * @returns {string} Safe string for logs ({@code "protocol://host"}, {@code "[none]"} for falsy, or
 *   {@code "[invalid]"} for unparseable input)
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
 * Build a fresh {@link JsonRpcProvider} for the given URL.
 *
 * @description Shared entry point used wherever the SDK needs a read-only RPC connection (default
 * read provider, contract registry fallbacks, tooling). Validates that {@code rpcUrl} is provided
 * and emits a {@code debug}-level log line with the redacted URL and role for observability. Does
 * not perform a live network probe — connectivity errors surface on the first request.
 *
 * @public
 * @param {string} rpcUrl - JSON-RPC endpoint URL
 * @param {string} [role] - Optional label for logs (e.g. {@code "read"}, {@code "write"})
 * @returns {JsonRpcProviderType} A new ethers {@link JsonRpcProvider} bound to {@code rpcUrl}
 * @throws {ConfigError} If {@code rpcUrl} is empty/missing
 */
function createProvider(rpcUrl, role) {
  requireConfigString(rpcUrl, 'rpcUrl', 'RPC URL is required');

  log.debug('createProvider', { rpcUrl: redactRpcUrl(rpcUrl), role });

  return new JsonRpcProvider(rpcUrl);
}

export { JsonRpcProvider, createProvider, redactRpcUrl };
