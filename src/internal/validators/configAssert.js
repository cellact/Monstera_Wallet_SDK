/**
 * Config-time assert wrappers that map {@link ValidationError} to {@link ConfigError}.
 *
 * @module internal/validators/configAssert
 */

import { ConfigError, ValidationError } from '../../errors/index.js';
import {
  requireAddress,
  requireChainId,
  requirePlainObject,
  requireString
} from '../assert.js';

/**
 * @param {unknown} value
 * @param {string} name
 * @param {string} message
 */
function requireConfigString(value, name, message) {
  try {
    requireString(value, name);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ConfigError(message, name);
    }
    throw error;
  }
}

/**
 * @param {unknown} value
 * @param {string} name
 * @param {{ missing: string, invalid: string }} messages
 */
function requireConfigChainId(value, name, messages) {
  try {
    requireChainId(value, name);
  } catch (error) {
    if (error instanceof ValidationError) {
      const message =
        value === undefined || value === null ? messages.missing : messages.invalid;
      throw new ConfigError(message, name);
    }
    throw error;
  }
}

/**
 * @param {unknown} value
 * @param {string} name
 * @param {string} message
 */
function requireConfigPlainObject(value, name, message) {
  try {
    requirePlainObject(value, name);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ConfigError(message, name);
    }
    throw error;
  }
}

/**
 * @param {unknown} value
 * @param {string} name
 * @param {string} message
 */
function requireConfigAddress(value, name, message) {
  try {
    requireAddress(value, name);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ConfigError(message, name);
    }
    throw error;
  }
}

export {
  requireConfigString,
  requireConfigChainId,
  requireConfigPlainObject,
  requireConfigAddress
};
