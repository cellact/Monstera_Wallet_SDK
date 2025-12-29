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
  SapphireRequiredError,
  WriteRequiresSignerError,
  EventParseError
} = require('./WalletError');


module.exports = {
  // Error classes
  WalletError,
  ValidationError,
  ConfigError,
  NetworkError,
  ContractRevertError,
  EventNotFoundError,
  SapphireRequiredError,
  WriteRequiresSignerError,
  EventParseError
};

