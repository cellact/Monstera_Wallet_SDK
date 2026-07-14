/**
 * Connect-time option parsing and validation helpers.
 * 
 * @module internal/validators/connectOptions
 */

import { ValidationError } from '../../errors/index.js';
import { requireNormalizedUsername, requirePlainObject, requireString, requireBytes32 } from '../validation/assert.js';

/**
 * Validate connect-time credentials and return a normalised input object.
 *
 * @public
 * @param {unknown} credentials
 * @returns {ConnectCredentials | null}
 * @throws {ValidationError}
 * 
 * @remarks
 * This function is used to validate the credentials input from the user.
 * - username's job is address resolution
 * - password's job is proof material for password-based authentication
 * - apiKey's job is proof material for API key-based authentication
 */
export function parseConnectCredentials(credentials) {
  if (credentials == null) return null;
  
  requirePlainObject(credentials, 'credentials', {
    message: 'credentials must be a plain object with username and at least one auth secret'
  });

  const { username, password, apiKey } = credentials;
  const normalizedUsername = requireNormalizedUsername(username, 'credentials.username');

  const hasPassword = password != null && String(password).trim() !== '';
  const hasApiKey = apiKey != null && String(apiKey).trim() !== '';

  if (!hasPassword && !hasApiKey) {
    throw new ValidationError(
      'credentials must include at least one of password or apiKey',
      'credentials',
      credentials
    );
  }

  const result = { username: normalizedUsername };
  if (hasPassword) {
    requireString(password, 'credentials.password');
    result.password = password;
  }
  if (hasApiKey) {
    requireBytes32(apiKey, 'credentials.apiKey');
    result.apiKey = apiKey;
  }
  return result;
}

/**
 * @param {Record<string, unknown>} options
 * @returns {{ signer: unknown; credentials: ConnectCredentials | null }}
 */
export function parseConnectInputs(options) {
  const signer = options.signer;
  return {
    signer: signer != null && signer !== '' ? signer : null,
    credentials: parseConnectCredentials(options.credentials)
  };
}
