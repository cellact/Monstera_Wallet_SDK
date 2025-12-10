/**
 * Base error class for Wallet SDK
 * 
 * Provides contextual error information following Auth0 SDK best practices:
 * - Descriptive error messages
 * - Error codes for programmatic handling
 * - Contextual information (function, parameters, etc.)
 */

class WalletError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Get error details as object
   * @returns {Object}
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
   * @returns {String}
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
 * Contract-related errors
 */
class ContractError extends WalletError {
  constructor(message, code, context = {}) {
    super(message, code, { ...context, type: 'contract' });
    this.name = 'ContractError';
  }
}

/**
 * Validation errors
 */
class ValidationError extends WalletError {
  constructor(message, parameter, value = null) {
    super(
      message,
      'VALIDATION_ERROR',
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
 * Configuration errors
 */
class ConfigurationError extends WalletError {
  constructor(message, missingField = null) {
    super(
      message,
      'CONFIGURATION_ERROR',
      {
        missingField,
        function: 'configuration'
      }
    );
    this.name = 'ConfigurationError';
  }
}

/**
 * Network/RPC errors
 */
class NetworkError extends WalletError {
  constructor(message, rpcUrl = null, originalError = null) {
    super(
      message,
      'NETWORK_ERROR',
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
 * Transaction errors
 */
class TransactionError extends WalletError {
  constructor(message, transactionHash = null, receipt = null) {
    super(
      message,
      'TRANSACTION_ERROR',
      {
        transactionHash,
        receipt,
        function: 'transaction'
      }
    );
    this.name = 'TransactionError';
  }
}

module.exports = {
  WalletError,
  ContractError,
  ValidationError,
  ConfigurationError,
  NetworkError,
  TransactionError
};

