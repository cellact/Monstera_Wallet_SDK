/**
 * Session-backed defaults for structured {@code authProof} inputs, keyed by built-in authenticator id.
 *
 * @typedef {import('../../../types/index.js').AuthProofInputOptions} AuthProofInputOptions
 * @typedef {import('../session/CredentialsSession.js').CredentialsSession} CredentialsSession
 *
 * @module internal/auth/proof/sessionAuthProofDefaults
 */

import { ValidationError } from '../../../errors/index.js';

/**
 * @param {unknown} authProof
 * @returns {authProof is Record<string, unknown>}
 */
function isStructuredAuthProof(authProof) {
  return authProof != null && typeof authProof === 'object' && !Array.isArray(authProof);
}

/**
 * Merge credentials-session material into structured {@code authProof} for a built-in authenticator.
 *
 * @description Password-based authenticators can derive missing fields from the session.
 * Signer-based authenticators always require an explicit {@code authProof.signer} on the call.
 *
 * @public
 * @param {Object} params
 * @param {string} params.authenticatorId - Built-in encoder id from the auth-proof registry
 * @param {CredentialsSession | null} params.session - Active credentials session, if any
 * @param {AuthProofInputOptions | null | undefined} params.authProof - Caller-supplied proof input
 * @returns {AuthProofInputOptions}
 * @throws {ValidationError} If required fields cannot be satisfied
 */
export function applySessionAuthProofDefaults({ authenticatorId, session, authProof }) {
  const partial = isStructuredAuthProof(authProof) ? authProof : {};

  switch (authenticatorId) {
    case 'passwordAuth': {
      if (!session) {
        throw missingAuthProofError('password', partial.password);
      }
      return { ...partial, password: partial.password ?? session.getPasswordBytes() };
    }
    case 'passwordMinuteSignatureAuth': {
      if (!session) {
        throw missingAuthProofError('passwordHash', partial.passwordHash);
      }
      return { ...partial, passwordHash: partial.passwordHash ?? session.getPasswordHash() };
    }
    case 'walletSignatureAuth':
      if (partial.signer == null) {
        throw new ValidationError(
          'authProof.signer is required for WalletSignatureAuthenticator; pass a whitelisted Wallet or HDNodeWallet',
          'authProof.signer',
          partial.signer
        );
      }
      return partial;
    case 'dualFactorAuth': {
      const merged = {
        ...partial,
        passwordHash: partial.passwordHash ?? session?.getPasswordHash()
      };
      if (merged.passwordHash == null) {
        throw missingAuthProofError('passwordHash', merged.passwordHash);
      }
      if (merged.signer == null) {
        throw new ValidationError(
          'authProof.signer is required for DualFactorAuthenticator; pass the guardian Wallet or HDNodeWallet',
          'authProof.signer',
          merged.signer
        );
      }
      return merged;
    }
    default:
      throw new ValidationError(
        'No built-in encoder for this authenticator; pass authProof as hex bytes',
        'authenticatorId',
        authenticatorId
      );
  }
}

/**
 * @private
 * @param {string} field
 * @param {unknown} value
 * @returns {ValidationError}
 */
function missingAuthProofError(field, value) {
  return new ValidationError(
    `authProof.${field} is required when no credentials session is active`,
    `authProof.${field}`,
    value
  );
}
