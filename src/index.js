/**
 * Monstera SDK - Main Entry Point
 * 
 * Single point of entry for the SDK.
 * The Monstera class is exported as the default export.
 */

import Monstera from './sdk/Monstera.js';
import {
  WalletError,
  ValidationError,
  ConfigError,
  NetworkError,
  ContractRevertError,
  EventNotFoundError,
  SapphireRequiredError,
  WriteRequiresSignerError,
  EventParseError
} from './errors/index.js';

// Export Monstera as the default export (main entry point)
export default Monstera;

// Also export as named export for flexibility
export { Monstera };

// Export error classes for programmatic error handling
export {
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

