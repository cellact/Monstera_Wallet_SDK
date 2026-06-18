/**
 * Connect-time option parsing and validation helpers.
 *
 * @module internal/validators/connectOptions
 */

import { requireNormalizedUsername, requirePlainObject, requireString } from '../assert.js';

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

  requirePlainObject(credentials, 'credentials', {
    message: 'credentials must be a plain object with username and password'
  });

  const { username, password } = credentials;

  const normalizedUsername = requireNormalizedUsername(username, 'credentials.username');

  requireString(password, 'credentials.password');

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
