/**
 * Base error class for Wallet SDK
 * 
 * Provides contextual error information with stable error codes:
 * - Descriptive error messages
 * - Stable error codes for programmatic handling
 * - Contextual information (function, parameters, etc.)
 */
class WalletError extends Error {
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
 * Validation errors - Invalid input parameters
 */
class ValidationError extends WalletError {
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
  constructor(message, transactionHash = null, receipt = null) {
    super(
      message,
      'TX_REVERTED',
      {
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
 * Permission errors - Insufficient permissions/role
 */
class PermissionError extends WalletError {
  constructor(message, requiredRole = null) {
    super(
      message,
      'PERMISSION_DENIED',
      {
        requiredRole,
        function: 'authorization'
      }
    );
    this.name = 'PermissionError';
  }
}

/**
 * Sapphire required errors - Operation requires Sapphire provider
 */
class SapphireRequiredError extends WalletError {
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

module.exports = {
  WalletError,
  ValidationError,
  ConfigError,
  NetworkError,
  ContractRevertError,
  EventNotFoundError,
  PermissionError,
  SapphireRequiredError,
  WriteRequiresSignerError
};
