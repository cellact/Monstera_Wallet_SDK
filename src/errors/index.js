/**
 * Error exports
 *
 * Central export point for all SDK error types
 */

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
} from './WalletError.js';

export { decodeCustomError, extractRpcRevertBytes } from './translators/revert.js';

export {
  applySdkContext,
  rethrowExecuteError,
  toWalletError,
  sdkErrorPipeline,
  ErrorPipeline
} from './pipeline.js';
