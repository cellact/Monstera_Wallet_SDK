/**
 * Base error class for Wallet SDK
 *
 * Provides contextual error information with stable error codes:
 * - Descriptive error messages
 * - Stable error codes for programmatic handling
 * - Contextual information (function, parameters, etc.)
 *
 * @typedef {import('../types/index.js').TransactionHash} TransactionHash
 * @typedef {import('../types/index.js').TransactionReceipt} TransactionReceipt
 * @typedef {import('../types/index.js').Bytes} Bytes
 */
class WalletError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Record<string, unknown>} [context={}] - Additional context information
   */
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    this.context = context;
    
    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get error details as object
   * @returns {Record<string, unknown>} Error details object
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
   * Get human-readable error message
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
 * Validation errors - Invalid input parameters
 */
class ValidationError extends WalletError {
  /**
   * @param {string} message - Error message
   * @param {string} parameter - Parameter name that failed validation
   * @param {unknown} [value=null] - Invalid parameter value
   */
  constructor(message, parameter, value = null) {
    super(
      message,
      'INVALID_ARGUMENT',
      {
        parameter,
        value,
        function: 'validation'
      }
    );
    this.name = 'ValidationError';
  }
}

/**
 * Configuration errors - Missing or invalid configuration
 */
class ConfigError extends WalletError {
  /**
   * @param {string} message - Error message
   * @param {string|null} [missingField=null] - Missing configuration field name
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
 * Network/RPC errors - Network communication failures
 */
class NetworkError extends WalletError {
  /**
   * @param {string} message - Error message
   * @param {string|null} [rpcUrl=null] - RPC URL that failed
   * @param {Error|null} [originalError=null] - Original error that occurred
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
 * Contract revert errors - Transaction reverted on-chain
 */
class ContractRevertError extends WalletError {
  /**
   * @param {string} message - Error message
   * @param {Bytes|null} [revertData=null] - Revert data (hex), if available
   * @param {string|null} [revertReason=null] - Decoded revert reason, if available
   * @param {TransactionHash|null} [transactionHash=null] - Transaction hash that reverted
   * @param {TransactionReceipt|null} [receipt=null] - Transaction receipt, if available
   */
  constructor(message, revertData = null, revertReason = null, transactionHash = null, receipt = null) {
    super(
      message,
      'TX_REVERTED',
      {
        revertData,
        revertReason,
        transactionHash,
        receipt,
        function: 'transaction'
      }
    );
    this.name = 'ContractRevertError';
  }
}

/**
 * Event not found errors - Expected event missing from receipt
 */
class EventNotFoundError extends WalletError {
  /**
   * @param {string} eventName - Name of the expected event
   * @param {TransactionHash|null} [transactionHash=null] - Transaction hash where event was expected
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
 * Sapphire required errors - Operation requires Sapphire provider
 */
class SapphireRequiredError extends WalletError {
  /**
   * @param {string} [message] - Error message (optional, defaults to standard message)
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
 * Write operation requires signer error
 */
class WriteRequiresSignerError extends WalletError {
  /**
   * @param {string} [operation='operation'] - Name of the operation that requires signer
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
 * Event parse errors - Event found but failed to parse/decode
 */
class EventParseError extends WalletError {
  /**
   * @param {string} eventName - Name of the event that failed to parse
   * @param {TransactionHash|null} [transactionHash=null] - Transaction hash containing the event
   * @param {Error|null} [originalError=null] - Original parsing error
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
