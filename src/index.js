/**
 * Monstera SDK - Main Entry Point
 * 
 * Single point of entry for the SDK.
 * The Monstera class is exported as the default export.
 */

const Monstera = require('./sdk/Monstera');
const {
  WalletError,
  ValidationError,
  ConfigError,
  NetworkError,
  ContractRevertError,
  EventNotFoundError,
  PermissionError,
  SapphireRequiredError,
  WriteRequiresSignerError
} = require('./errors');

// Export Monstera as the default export (main entry point)
module.exports = Monstera;

// Also export as named export for flexibility
module.exports.Monstera = Monstera;

// Export error classes for programmatic error handling
module.exports.WalletError = WalletError;
module.exports.ValidationError = ValidationError;
module.exports.ConfigError = ConfigError;
module.exports.NetworkError = NetworkError;
module.exports.ContractRevertError = ContractRevertError;
module.exports.EventNotFoundError = EventNotFoundError;
module.exports.PermissionError = PermissionError;
module.exports.SapphireRequiredError = SapphireRequiredError;
module.exports.WriteRequiresSignerError = WriteRequiresSignerError;

