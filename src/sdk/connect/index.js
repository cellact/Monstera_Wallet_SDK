/**
 * Monstera connect entry points (admin, end-user, full, and legacy routing).
 *
 * @typedef {import('../../types/index.js').ConnectAdminOptions} ConnectAdminOptions
 * @typedef {import('../../types/index.js').ConnectUserOptions} ConnectUserOptions
 * @typedef {import('../../types/index.js').ConnectFullOptions} ConnectFullOptions
 * @typedef {import('../../types/index.js').ConnectOptions} ConnectOptions
 * @typedef {import('../Monstera.js').default} Monstera
 *
 * @module sdk/connect
 */

import { buildMonsteraConfig, inferConnectProfile } from './profiles.js';

/**
 * @param {Record<string, unknown>} options
 * @param {import('../../types/index.js').ConnectProfile} profile
 * @param {new (config: import('../../types/index.js').MonsteraConfigOptions) => Monstera} MonsteraClass
 * @returns {Monstera}
 */
function connectWithProfile(options, profile, MonsteraClass) {
  return new MonsteraClass(buildMonsteraConfig(options, profile));
}

/**
 * @public
 * @param {ConnectAdminOptions} options
 * @param {new (config: import('../../types/index.js').MonsteraConfigOptions) => Monstera} MonsteraClass
 * @returns {Monstera}
 */
export function connectAdmin(options, MonsteraClass) {
  return connectWithProfile(options, 'admin', MonsteraClass);
}

/**
 * @public
 * @param {ConnectUserOptions} options
 * @param {new (config: import('../../types/index.js').MonsteraConfigOptions) => Monstera} MonsteraClass
 * @returns {Monstera}
 */
export function connectUser(options, MonsteraClass) {
  return connectWithProfile(options, 'user', MonsteraClass);
}

/**
 * @public
 * @param {ConnectFullOptions} options
 * @param {new (config: import('../../types/index.js').MonsteraConfigOptions) => Monstera} MonsteraClass
 * @returns {Monstera}
 */
export function connectFull(options, MonsteraClass) {
  return connectWithProfile(options, 'full', MonsteraClass);
}

/**
 * Backward-compatible connect: routes to admin, user, full, or readonly based on options.
 *
 * @public
 * @param {ConnectOptions} options
 * @param {new (config: import('../../types/index.js').MonsteraConfigOptions) => Monstera} MonsteraClass
 * @returns {Monstera}
 */
export function connectLegacy(options, MonsteraClass) {
  return connectWithProfile(options, inferConnectProfile(options), MonsteraClass);
}

export { buildMonsteraConfig, inferConnectProfile } from './profiles.js';
