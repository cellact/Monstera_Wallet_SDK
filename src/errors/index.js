/**
 * Error exports
 * 
 * Central export point for all SDK error types
 */

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
} = require('./WalletError');


module.exports = {
  // Error classes
  WalletError,
  ValidationError,
  ConfigError,
  NetworkError,
  ContractRevertError,
  EventNotFoundError,
  PermissionError,
  SapphireRequiredError,
  WriteRequiresSignerError,
};

