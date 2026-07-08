/**
 * ApiKeySession auth-proof builder via on-chain pure helpers.
 *
 * Delegates MAC computation and ABI encoding to {@code ApiKeySessionAuthenticator}
 * ({@code computeTokenMac}, {@code computeActionMac}, {@code buildTokenAuthProof},
 * {@code buildActionAuthProof}).
 *
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../types/index.js').ChainId} ChainId
 * @typedef {import('../../../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 *
 * @module internal/auth/apiKeySession/onChainProof
 */

import { getApiKeySessionAuthenticatorContract } from '../../../contracts/authenticators/ApiKeySessionAuthenticator.js';
import { requireAddress, requireBytes32 } from '../../assert.js';
import { defaultProofDeadline } from '../authenticators/deadline.js';
import { SCOPE_SIGN_ALL } from './constants.js';
import { isApiKeySessionTokenMode } from './mode.js';

/**
 * @param {EthersAbstractProvider} readProvider
 * @param {Address} authenticatorAddr
 * @returns {import('../../../types/index.js').EthersContract}
 */
function getReadContract(readProvider, authenticatorAddr) {
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  return getApiKeySessionAuthenticatorContract(readProvider, authenticatorAddr);
}

/**
 * Build ABI-encoded {@code authProof} bytes by calling the authenticator's on-chain pure helpers.
 *
 * @public
 * @async
 * @param {Object} options
 * @param {EthersAbstractProvider} options.readProvider
 * @param {Address} options.authenticatorAddr
 * @param {Bytes32} options.apiKeySecret
 * @param {Address} options.keyVaultAddr
 * @param {ChainId} options.chainId
 * @param {Bytes32} [options.actionHash]
 * @param {'token' | 'action'} [options.mode]
 * @param {number | bigint} [options.expiry]
 * @param {number | bigint} [options.scopeMask]
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
