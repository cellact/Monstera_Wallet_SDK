/**
 * Monstera SDK - Public package entry point.
 *
 * Re-exports the {@link Monstera} class as both the default export and a named export,
 * and re-exports every {@link WalletError} subclass plus the error pipeline helpers
 * from `./errors/index.js` (single source of truth) so consumers can `instanceof`-check
 * thrown errors without importing from a deep path.
 *
 * @module @monstera_protocol/sdk
 */

import Monstera from './sdk/Monstera.js';

// Re-export all error classes
export * from './errors/index.js';

// Export Monstera as the default export (main entry point)
export default Monstera;

// Also export as named export for flexibility
export { Monstera };
