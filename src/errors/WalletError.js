/**
 * The complete {@link WalletError} hierarchy used by the SDK.
 *
 * Every error thrown out of a public Monstera method (and every error produced inside the
 * {@code sdkErrorPipeline}) is one of the classes defined below. They share a stable
 * {@code code} string and a {@code context} bag so callers can handle them programmatically
 * without parsing English messages.
 *
 * Class hierarchy:
 * - {@link WalletError} — base
 *   - {@link ValidationError} — code {@code "INVALID_ARGUMENT"}
 *   - {@link ConfigError} — code {@code "MISSING_CONFIG"}
 *   - {@link NetworkError} — code {@code "RPC_ERROR"}
 *   - {@link ContractRevertError} — code {@code "TX_REVERTED"}
 *   - {@link EventNotFoundError} — code {@code "EVENT_NOT_FOUND"}
 *   - {@link SapphireRequiredError} — code {@code "SAPPHIRE_REQUIRED"}
 *   - {@link WriteRequiresSignerError} — code {@code "WRITE_REQUIRES_SIGNER"}
 *   - {@link EventParseError} — code {@code "EVENT_PARSE_ERROR"}
 *
 * @typedef {import('../types/index.js').TransactionHash} TransactionHash
 * @typedef {import('../types/index.js').TransactionReceipt} TransactionReceipt
 * @typedef {import('../types/index.js').Bytes} Bytes
 *
 * @module errors/WalletError
 */

import { sanitizer } from '../internal/sanitization/index.js';

/**
 * Base class for every error thrown by the SDK.
 *
 * Carries a stable error {@code code} string for programmatic handling and a free-form
 * {@code context} bag (already sanitised by callers / subclasses) for diagnostics.
 *
 * @public
 */
class WalletError extends Error {
  /**
   * @public
   * @param {string} message - Human readable error message
   * @param {string} code - Stable error code for programmatic dispatch (e.g. {@code "INVALID_ARGUMENT"})
   * @param {Record<string, unknown>} [context={}] - Additional context (function name, parameter,
   *   transaction hash, etc.). Should already be sanitised by the caller.
   */
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    this.context = context;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialise the error into a JSON-friendly object.
   *
   * @description Used by structured loggers and by tests asserting on error context. Includes the
   * stack trace as-is — callers responsible for redaction must do it before logging.
   *
   * @public
   * @returns {Record<string, unknown>} Plain object with {@code name}, {@code message},
   *   {@code code}, {@code context}, {@code stack}
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack
    };
  }

  /**
   * Render a human-readable single-line + indented summary of the error.
   *
   * @description Includes the code, and (when present) the {@code function} and {@code parameter}
   * fields from {@code context}. Other context entries are intentionally omitted to keep the
   * output short.
   *
   * @public
   * @returns {string} Human-readable error message
   */
  toString() {
    let str = `${this.name}: ${this.message}`;
    if (this.code) {
      str += ` (Code: ${this.code})`;
    }
    if (this.context.function) {
      str += `\n  Function: ${this.context.function}`;
    }
    if (this.context.parameter) {
      str += `\n  Parameter: ${this.context.parameter}`;
    }
    return str;
  }
}

/**
 * Thrown when a public/internal helper receives an invalid argument.
 *
 * @description Code: {@code "INVALID_ARGUMENT"}. The offending parameter name and value are
 * captured in {@code context}; the value is run through {@link sanitizer.forValidationValue} so
 * sensitive parameters never leak.
 *
 * @public
 */
class ValidationError extends WalletError {
  /**
   * @public
   * @param {string} message - Error message
   * @param {string} parameter - Parameter name that failed validation
   * @param {unknown} [value=null] - Invalid parameter value (sanitised before being stored)
   */
  constructor(message, parameter, value = null) {
    super(
      message,
      'INVALID_ARGUMENT',
      {
        parameter,
        value: sanitizer.forValidationValue(parameter, value),
        function: 'validation'
      }
    );
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when SDK configuration is missing or malformed.
 *
 * @description Code: {@code "MISSING_CONFIG"}. Used during {@code Monstera.connect} address
 * validation, RPC URL checks, and any time a contract address is required but not provided.
 *
 * @public
 */
class ConfigError extends WalletError {
  /**
   * @public
   * @param {string} message - Error message
   * @param {string | null} [missingField=null] - Name of the missing/invalid configuration field
   */
  constructor(message, missingField = null) {
    super(
      message,
      'MISSING_CONFIG',
      {
        missingField,
        function: 'configuration'
      }
    );
    this.name = 'ConfigError';
  }
}

/**
 * Thrown for RPC / network communication failures.
 *
 * @description Code: {@code "RPC_ERROR"}. Wraps the underlying transport error in
 * {@code originalError} (also exposed as a property for compatibility with consumers that crawl
 * {@code .originalError} chains).
 *
 * @public
 */
class NetworkError extends WalletError {
  /**
   * @public
   * @param {string} message - Error message
   * @param {string | null} [rpcUrl=null] - RPC URL that failed (may be null on aggregate failures)
   * @param {Error | null} [originalError=null] - Underlying transport / fetch error
   */
  constructor(message, rpcUrl = null, originalError = null) {
    super(
      message,
      'RPC_ERROR',
      {
        rpcUrl,
        originalError: originalError ? originalError.message : null,
        function: 'network'
      }
    );
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

/**
 * Thrown when a transaction reverts on-chain (or a {@code call} reverts during simulation).
 *
 * @description Code: {@code "TX_REVERTED"}. The {@code context} captures both the raw
 * {@code revertData} and (where decodable) the {@code revertReason}, plus optional decoded args
 * from custom Solidity errors.
 *
 * @public
 */
class ContractRevertError extends WalletError {
  /**
   * @public
   * @param {string} message - Error message
   * @param {Bytes | null} [revertData=null] - Raw revert data (hex), if available
   * @param {string | null} [revertReason=null] - Decoded revert reason, if available
   * @param {TransactionHash | null} [transactionHash=null] - Transaction hash that reverted
   * @param {TransactionReceipt | null} [receipt=null] - Transaction receipt, if available
   * @param {Record<string, unknown>} [extraContext={}] - Additional decoded fields (e.g.
   *   {@code revertArgs} from a decoded custom error)
   */
  constructor(message, revertData = null, revertReason = null, transactionHash = null, receipt = null, extraContext = {}) {
    super(
      message,
      'TX_REVERTED',
      {
        revertData,
        revertReason,
        transactionHash,
        receipt,
        function: 'transaction',
        ...extraContext
      }
    );
    this.name = 'ContractRevertError';
  }
}

/**
 * Thrown when an expected event is absent from a successful transaction receipt.
 *
 * @description Code: {@code "EVENT_NOT_FOUND"}. Surfaces from {@code ExecutionPipeline.executeWrite}
 * when an {@code expectEvent} is configured but the event signature is not present in the logs.
 *
 * @public
 */
class EventNotFoundError extends WalletError {
  /**
   * @public
   * @param {string} eventName - Name of the expected event
   * @param {TransactionHash | null} [transactionHash=null] - Transaction hash where the event was expected
   */
  constructor(eventName, transactionHash = null) {
    super(
      `${eventName} event not found in transaction receipt`,
      'EVENT_NOT_FOUND',
      {
        eventName,
        transactionHash,
        function: 'event_parsing'
      }
    );
    this.name = 'EventNotFoundError';
  }
}

/**
 * Thrown when an operation requires a Sapphire-wrapped signer / provider but none is available.
 *
 * @description Code: {@code "SAPPHIRE_REQUIRED"}. Most commonly raised when
 * {@code @oasisprotocol/sapphire-ethers-v6} is missing or the user supplied a non-signer.
 *
 * @public
 */
class SapphireRequiredError extends WalletError {
  /**
   * @public
   * @param {string} [message] - Optional override message; defaults to a standard sentence
   */
  constructor(message) {
    super(
      message || 'Sapphire signer is required for this operation',
      'SAPPHIRE_REQUIRED',
      {
        function: 'sapphire_check'
      }
    );
    this.name = 'SapphireRequiredError';
  }
}

/**
 * Thrown when a write method is invoked on a Monstera instance without a configured signer.
 *
 * @description Code: {@code "WRITE_REQUIRES_SIGNER"}. Hint message instructs the caller to pass
 * {@code signer} into {@code Monstera.connect}.
 *
 * @public
 */
class WriteRequiresSignerError extends WalletError {
  /**
   * @public
   * @param {string} [operation='operation'] - Name of the operation that requires a signer
   */
  constructor(operation = 'operation') {
    super(
      `Signer is required for ${operation}. Use Monstera.connect({ signer, ... })`,
      'WRITE_REQUIRES_SIGNER',
      {
        operation,
        function: 'signer_check'
      }
    );
    this.name = 'WriteRequiresSignerError';
  }
}

/**
 * Thrown when an expected event is present in the receipt but cannot be decoded.
 *
 * @description Code: {@code "EVENT_PARSE_ERROR"}. The underlying decoder error is captured in
 * {@code originalError} (and the message field of {@code context.originalError}).
 *
 * @public
 */
class EventParseError extends WalletError {
  /**
   * @public
   * @param {string} eventName - Name of the event that failed to parse
   * @param {TransactionHash | null} [transactionHash=null] - Transaction hash containing the event
   * @param {Error | null} [originalError=null] - Underlying decoder error
   */
  constructor(eventName, transactionHash = null, originalError = null) {
    super(
      `Failed to parse ${eventName} event: ${originalError?.message || 'Unknown parsing error'}`,
      'EVENT_PARSE_ERROR',
      {
        eventName,
        transactionHash,
        originalError: originalError ? originalError.message : null,
        function: 'event_parsing'
      }
    );
    this.name = 'EventParseError';
    this.originalError = originalError;
  }
}

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
