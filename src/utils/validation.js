/**
 * Validation utilities
 * 
 * Provides common validation functions for wallet operations
 */

const { ValidationError } = require('../errors/WalletError');

/**
 * Validate Ethereum address
 * 
 * @param {String} address - Address to validate
 * @param {String} parameterName - Name of parameter for error message
 * @throws {ValidationError} If address is invalid
 */
function validateAddress(address, parameterName = 'address') {
  if (!address) {
    throw new ValidationError(
      `${parameterName} is required`,
      parameterName
    );
  }
  
  if (typeof address !== 'string') {
    throw new ValidationError(
      `${parameterName} must be a string`,
      parameterName,
      address
    );
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new ValidationError(
      `${parameterName} is not a valid Ethereum address: ${address}`,
      parameterName,
      address
    );
  }
}

/**
 * Validate username
 * 
 * @param {String} username - Username to validate
 * @throws {ValidationError} If username is invalid
 */
function validateUsername(username) {
  if (!username) {
    throw new ValidationError('Username is required', 'username');
  }
  
  if (typeof username !== 'string') {
    throw new ValidationError('Username must be a string', 'username', username);
  }
  
  if (username.length === 0) {
    throw new ValidationError('Username cannot be empty', 'username');
  }
  
  if (username.length > 100) {
    throw new ValidationError('Username cannot exceed 100 characters', 'username', username);
  }
}

/**
 * Validate secret
 * 
 * @param {String|Buffer} secret - Secret to validate
 * @throws {ValidationError} If secret is invalid
 */
function validateSecret(secret) {
  if (!secret) {
    throw new ValidationError('Secret is required', 'secret');
  }
  
  if (typeof secret !== 'string' && !Buffer.isBuffer(secret)) {
    throw new ValidationError(
      'Secret must be a string or Buffer',
      'secret',
      typeof secret
    );
  }
  
  if (typeof secret === 'string' && secret.length === 0) {
    throw new ValidationError('Secret cannot be empty', 'secret');
  }
  
  if (Buffer.isBuffer(secret) && secret.length === 0) {
    throw new ValidationError('Secret buffer cannot be empty', 'secret');
  }
}

/**
 * Validate private key
 * 
 * @param {String} privateKey - Private key to validate
 * @param {String} parameterName - Name of parameter for error message
 * @throws {ValidationError} If private key is invalid
 */
function validatePrivateKey(privateKey, parameterName = 'privateKey') {
  if (!privateKey) {
    throw new ValidationError(`${parameterName} is required`, parameterName);
  }
  
  if (typeof privateKey !== 'string') {
    throw new ValidationError(
      `${parameterName} must be a string`,
      parameterName,
      typeof privateKey
    );
  }
  
  // Remove 0x prefix if present for validation
  const key = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  
  if (!/^[a-fA-F0-9]{64}$/.test(key)) {
    throw new ValidationError(
      `${parameterName} is not a valid private key (must be 64 hex characters)`,
      parameterName
    );
  }
}

/**
 * Validate RPC URL
 * 
 * @param {String} rpcUrl - RPC URL to validate
 * @throws {ValidationError} If RPC URL is invalid
 */
function validateRpcUrl(rpcUrl) {
  if (!rpcUrl) {
    throw new ValidationError('RPC URL is required', 'rpcUrl');
  }
  
  if (typeof rpcUrl !== 'string') {
    throw new ValidationError('RPC URL must be a string', 'rpcUrl', typeof rpcUrl);
  }
  
  try {
    const url = new URL(rpcUrl);
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) {
      throw new ValidationError(
        'RPC URL must use http, https, ws, or wss protocol',
        'rpcUrl',
        rpcUrl
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      `RPC URL is not a valid URL: ${rpcUrl}`,
      'rpcUrl',
      rpcUrl
    );
  }
}

module.exports = {
  validateAddress,
  validateUsername,
  validateSecret,
  validatePrivateKey,
  validateRpcUrl
};

