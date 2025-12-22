/**
 * Monstera SDK - Main Entry Point
 * 
 * Single point of entry for the SDK.
 * The Monstera class is exported as the default export.
 */

const Monstera = require('./sdk/Monstera');

// Export Monstera as the default export (main entry point)
module.exports = Monstera;

// Also export as named export for flexibility
module.exports.Monstera = Monstera;

