/**
 * Provider capability validators.
 *
 * @module internal/validation/provider
 */

import { ValidationError } from '../../errors/index.js';

/**
 * @param {unknown} provider
 * @param {string} method
 * @param {string} [name]
 * @param {{ message?: string }} [options]
 */
export function requireProviderMethod(provider, method, name = 'provider', options = {}) {
  const { message } = options;

  if (!provider || typeof /** @type {Record<string, unknown>} */ (provider)[method] !== 'function') {
    throw new ValidationError(
      message ?? `${name} must expose ${method}()`,
      name,
      provider
    );
  }
}
