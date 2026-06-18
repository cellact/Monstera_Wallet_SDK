/**
 * Connect-time option parsing and validation helpers.
 *
 * @module internal/validators/connectOptions
 */

import { ValidationError } from '../../errors/index.js';
import { requireNormalizedUsername } from '../assert.js';

/**
 * @typedef {Object} ConnectCredentialsInput
 * @property {string} username
 * @property {string} password
 */

/**
 * Validate connect-time credentials and return a normalised input object.
 *
 * @public
 * @param {unknown} credentials
 * @returns {ConnectCredentialsInput | null}
 * @throws {ValidationError}
 */
export function parseConnectCredentials(credentials) {
  if (credentials == null) {
    return null;
  }

  if (typeof credentials !== 'object' || Array.isArray(credentials)) {
    throw new ValidationError(
      'credentials must be a plain object with username and password',
      'credentials',
      credentials
    );
  }

  const { username, password } = /** @type {Record<string, unknown>} */ (credentials);

  const normalizedUsername = requireNormalizedUsername(username, 'credentials.username');

  if (typeof password !== 'string' || password.length === 0) {
    throw new ValidationError(
      'credentials.password must be a non-empty string',
      'credentials.password',
      undefined
    );
  }

  return { username: normalizedUsername, password };
}

/**
 * @param {Record<string, unknown>} options
 * @returns {{ signer: unknown; credentials: ConnectCredentialsInput | null }}
 */
export function parseConnectInputs(options) {
  const signer = options.signer;
  return {
    signer: signer != null && signer !== '' ? signer : null,
    credentials: parseConnectCredentials(options.credentials)
  };
}
