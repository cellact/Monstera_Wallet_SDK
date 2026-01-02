/**
 * Monstera SDK - Main Entry Point
 * 
 * Single point of entry for the SDK.
 * The Monstera class is exported as the default export.
 * 
 * Error classes are automatically re-exported from './errors/index.js'
 * - No manual maintenance required when adding new error classes
 * - Single source of truth: src/errors/index.js
 */

import Monstera from './sdk/Monstera.js';

// Re-export all error classes
export * from './errors/index.js';

// Export Monstera as the default export (main entry point)
export default Monstera;

// Also export as named export for flexibility
export { Monstera };
