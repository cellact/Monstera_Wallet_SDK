/**
 * ApiKeySessionAuthenticator auth-proof builder via on-chain pure helpers.
 *
 * @module internal/auth/proof/builders/apiKeySession
 */

import { getApiKeySessionAuthenticatorContract } from '../../../../contracts/authenticators/ApiKeySessionAuthenticator.js';
import { requireAddress, requireBytes32 } from '../../../validation/assert.js';
import { defaultProofDeadline } from '../common.js';
import {
  isApiKeySessionTokenMode,
  SCOPE_SIGN_ALL
} from '../../specs/apiKeySession.js';

/**
 * @param {EthersAbstractProvider} readProvider
 * @param {Address} authenticatorAddr
 * @returns {EthersContract}
 */
function getReadContract(readProvider, authenticatorAddr) {
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  return getApiKeySessionAuthenticatorContract(readProvider, authenticatorAddr);
}

/**
 * @param {Object} options
 * @returns {Promise<Bytes>}
 */
export async function createAuthProofApiKeySession(options) {
  const {
    readProvider,
    authenticatorAddr,
    apiKeySecret,
    keyVaultAddr,
    chainId,
    actionHash,
    mode,
    expiry,
    scopeMask
  } = options;

  const contract = getReadContract(readProvider, authenticatorAddr);

  if (isApiKeySessionTokenMode({ mode, expiry, scopeMask })) {
    const resolvedExpiry = expiry ?? defaultProofDeadline();
    const resolvedScopeMask = scopeMask ?? SCOPE_SIGN_ALL;
    const mac = await contract.computeTokenMac(
      apiKeySecret,
      chainId,
      keyVaultAddr,
      resolvedExpiry,
      resolvedScopeMask
    );

    return contract.buildTokenAuthProof(resolvedExpiry, resolvedScopeMask, mac);
  }

  requireBytes32(actionHash, 'actionHash');
  const mac = await contract.computeActionMac(apiKeySecret, actionHash);
  return contract.buildActionAuthProof(mac);
}
