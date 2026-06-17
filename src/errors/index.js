/**
 * Central re-export module for the SDK's error surface.
 *
 * Aggregates everything callers may need to handle SDK errors:
 * - the {@link WalletError} hierarchy with stable error codes
 *   ({@link ValidationError}, {@link ConfigError}, {@link NetworkError},
 *   {@link ContractRevertError}, {@link EventNotFoundError}, {@link SapphireRequiredError},
 *   {@link WriteRequiresSignerError}, {@link CredentialsRequiredError}, {@link EventParseError})
 * - the on-chain revert decoding helpers ({@link decodeCustomError},
 *   {@link extractRpcRevertBytes})
 * - the {@link ErrorPipeline} machinery and the canonical {@link sdkErrorPipeline} singleton
 *   used by {@code ExecutionPipeline}
 *
 * Public consumers normally only need the error classes; the pipeline helpers are exported for
 * advanced integrations / tests.
 *
 * @module errors
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
  CredentialsRequiredError,
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
