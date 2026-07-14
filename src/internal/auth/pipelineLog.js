/**
 * Structured logging for auth proof pipelines (vault + explicit flows).
 *
 * @module internal/auth/pipelineLog
 */

import log from '../logger.js';
import { isApiKeySessionTokenMode } from './specs/apiKeySession.js';

/**
 * @param {string} encoderId
 * @param {Record<string, unknown>} [input]
 * @returns {'token' | 'action' | undefined}
 */
function resolveApiKeySessionProofMode(encoderId, input) {
  if (encoderId !== 'apiKeySessionAuth' || input == null) {
    return undefined;
  }
  return isApiKeySessionTokenMode(input) ? 'token' : 'action';
}

/**
 * @param {Bytes | Uint8Array | undefined} authProof
 * @returns {number | undefined}
 */
function authProofByteLength(authProof) {
  if (typeof authProof === 'string') {
    return Math.max(0, (authProof.length - 2) / 2);
  }
  if (authProof instanceof Uint8Array) {
    return authProof.length;
  }
  return undefined;
}

/**
 * @public
 * @param {Object} params
 * @param {Address} params.keyVaultAddr
 */
export function logVaultAuthPreEncoded({ keyVaultAddr }) {
  log.info('auth pipeline: vault call', {
    path: 'vault',
    encoderId: 'pre-encoded',
    keyVaultAddr,
    proofSource: 'caller'
  });
}

/**
 * @public
 * @param {Object} params
 * @param {string} params.encoderId
 * @param {string} params.flowId
 * @param {Address} params.authenticatorAddr
 * @param {Address} params.keyVaultAddr
 * @param {Record<string, unknown>} [params.proofInput]
 */
export function logVaultAuthResolved({ encoderId, flowId, authenticatorAddr, keyVaultAddr, proofInput }) {
  const proofMode = resolveApiKeySessionProofMode(encoderId, proofInput);

  log.info('auth pipeline: vault call', {
    path: 'vault',
    encoderId,
    flowId,
    authenticatorAddr,
    keyVaultAddr,
    ...(proofMode && { proofMode })
  });

  log.debug('auth pipeline: vault call detail', {
    actionSelector: proofInput?.action?.selector,
    actionTarget: proofInput?.action?.target,
    proofMode,
    sessionApiKey: proofInput?.apiKeySecret != null,
    tokenExpiry: proofInput?.expiry
  });
}

/**
 * @public
 * @param {Object} params
 * @param {string} params.flowId
 * @param {string} params.encoderId
 * @param {Address} params.authenticatorAddr
 * @param {Address} [params.keyVaultAddr]
 * @param {AuthProofFlowOptions} [params.flowOptions]
 */
export function logExplicitAuthPrepare({ flowId, encoderId, authenticatorAddr, keyVaultAddr, flowOptions }) {
  log.info('auth pipeline: explicit flow', {
    path: 'explicit',
    flowId,
    encoderId,
    authenticatorAddr,
    keyVaultAddr
  });

  log.debug('auth pipeline: explicit flow detail', {
    useVerifyProbe: flowOptions?.useVerifyProbe === true,
    includeAuthContext: flowOptions?.includeAuthContext === true
  });
}

/**
 * @public
 * @param {Object} params
 * @param {string} params.encoderId
 * @param {string} params.flowId
 * @param {Address} params.authenticatorAddr
 * @param {Address} params.keyVaultAddr
 * @param {Record<string, unknown>} [params.proofInput]
 * @param {AuthActionInput} [params.action]
 * @param {Bytes | Uint8Array} [params.authProof]
 */
export function logAuthProofEncoded({
  encoderId,
  flowId,
  authenticatorAddr,
  keyVaultAddr,
  proofInput,
  action,
  authProof
}) {
  const proofMode = resolveApiKeySessionProofMode(encoderId, proofInput);

  log.debug('auth pipeline: proof encoded', {
    encoderId,
    flowId,
    authenticatorAddr,
    keyVaultAddr,
    ...(proofMode && { proofMode }),
    actionSelector: action?.selector,
    authProofBytes: authProofByteLength(authProof)
  });
}
