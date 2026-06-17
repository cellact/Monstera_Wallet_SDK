/**
 * Connect profile strategies — validate role-specific inputs and build config slices.
 *
 * @typedef {import('../../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 * @typedef {import('../../types/index.js').ConnectProfile} ConnectProfile
 *
 * @module sdk/connect/profiles
 */

import MonsteraConfig from '../../config/monstera.js';
import log from '../../internal/logger.js';
import { ValidationError } from '../../errors/index.js';
import { parseConnectInputs } from '../../internal/validators/connectOptions.js';

/**
 * @param {Record<string, unknown>} [options]
 * @returns {{ logLevel: string; provider: import('../../types/index.js').EthersProvider | null; checkVersion: boolean | undefined }}
 */
function resolveConnectExtension(options = {}) {
  const logLevel = options.logLevel ?? (options.debug === true ? 'debug' : 'error');
  log.setLevel(logLevel);

  return {
    logLevel,
    provider: options.provider ?? null,
    checkVersion: options.checkVersion
  };
}

/**
 * @param {unknown} signer
 * @throws {ValidationError}
 */
function requireSigner(signer, message, parameter = 'signer') {
  if (!signer) {
    throw new ValidationError(message, parameter, signer);
  }
}

/**
 * @param {unknown} credentials
 * @param {string} message
 * @param {string} [rawCredentials]
 * @throws {ValidationError}
 */
function requireCredentials(credentials, message, rawCredentials) {
  if (!credentials) {
    throw new ValidationError(message, 'credentials', rawCredentials);
  }
}

/**
 * @param {unknown} signer
 * @param {unknown} credentials
 * @param {string} signerMessage
 * @param {string} [signerParameter='signer']
 * @throws {ValidationError}
 */
function forbidSigner(signer, credentials, signerMessage, signerParameter = 'signer') {
  if (signer) {
    throw new ValidationError(signerMessage, signerParameter, undefined);
  }
}

/**
 * @param {unknown} credentials
 * @param {string} credentialsMessage
 * @throws {ValidationError}
 */
function forbidCredentials(credentials, credentialsMessage) {
  if (credentials) {
    throw new ValidationError(credentialsMessage, 'credentials', undefined);
  }
}

/**
 * @typedef {Object} ConnectProfileStrategy
 * @property {(options: Record<string, unknown>) => MonsteraConfigOptions} build
 */

/** @type {Record<ConnectProfile, ConnectProfileStrategy>} */
export const CONNECT_PROFILE_STRATEGIES = {
  admin: {
    build(options) {
      const extension = resolveConnectExtension(options);
      const base = MonsteraConfig.resolveBaseConfig(options);
      const { signer, credentials } = parseConnectInputs(options);

      requireSigner(signer, 'signer is required for Monstera.connectAdmin');
      forbidCredentials(
        credentials,
        'credentials must not be passed to Monstera.connectAdmin; use Monstera.connectUser or Monstera.connect for end-user access'
      );

      return { ...base, signer, ...extension, connectProfile: 'admin' };
    }
  },

  user: {
    build(options) {
      const extension = resolveConnectExtension(options);
      const base = MonsteraConfig.resolveBaseConfig(options);
      const { signer, credentials } = parseConnectInputs(options);

      requireCredentials(
        credentials,
        'credentials with username and password are required for Monstera.connectUser',
        options.credentials
      );
      forbidSigner(
        signer,
        credentials,
        'signer must not be passed to Monstera.connectUser; use Monstera.connectAdmin or Monstera.connect for admin writes'
      );

      return { ...base, signer: null, credentials, ...extension, connectProfile: 'user' };
    }
  },

  full: {
    build(options) {
      const extension = resolveConnectExtension(options);
      const base = MonsteraConfig.resolveBaseConfig(options);
      const { signer, credentials } = parseConnectInputs(options);

      requireSigner(signer, 'signer is required for Monstera.connectFull', 'signer');
      requireCredentials(
        credentials,
        'credentials are required for Monstera.connectFull; use Monstera.connectAdmin or Monstera.connectUser instead',
        options.credentials
      );

      return { ...base, signer, credentials, ...extension, connectProfile: 'full' };
    }
  },

  readonly: {
    build(options) {
      const extension = resolveConnectExtension(options);
      const base = MonsteraConfig.resolveBaseConfig(options);
      const { signer, credentials } = parseConnectInputs(options);

      if (signer || credentials) {
        throw new ValidationError(
          'Monstera.connect without signer or credentials creates a read-only instance; use connectAdmin, connectUser, or pass both signer and credentials',
          'signer',
          undefined
        );
      }

      return { ...base, signer: null, ...extension, connectProfile: 'readonly' };
    }
  }
};

/**
 * @public
 * @param {Record<string, unknown>} options
 * @param {ConnectProfile} profile
 * @returns {MonsteraConfigOptions}
 */
export function buildMonsteraConfig(options, profile) {
  const strategy = CONNECT_PROFILE_STRATEGIES[profile];
  return strategy.build(options);
}

/**
 * Infer connect profile from legacy connect options.
 *
 * @public
 * @param {Record<string, unknown>} [options]
 * @returns {ConnectProfile}
 */
export function inferConnectProfile(options = {}) {
  const hasSigner = options.signer != null && options.signer !== '';
  const hasCredentials = options.credentials != null;

  if (hasSigner && hasCredentials) {
    return 'full';
  }
  if (hasSigner) {
    return 'admin';
  }
  if (hasCredentials) {
    return 'user';
  }
  return 'readonly';
}
