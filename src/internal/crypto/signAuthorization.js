/**
 * Orchestrates EIP-7702-style authorization signing via KeyVault + {@link authorization.js} primitives.
 * Keeps {@link Monstera} thin; validation and ethers usage live here and in {@link authorization.js}.
 *
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').SignedAuthorizationResult} SignedAuthorizationResult
 * @typedef {import('../../types/index.js').SignAuthorizationOptions} SignAuthorizationOptions
 * @typedef {import('../../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 * @typedef {import('../../clients/keyVault/KeyVaultClient.js').default} KeyVaultClient
 * @typedef {import('../../types/index.js').EncodeAuthProofOptionsResult} EncodeAuthProofOptionsResult
 * @typedef {import('../../types/index.js').ResolvedSignAuthorizationInputs} ResolvedSignAuthorizationInputs
 */

import { ValidationError } from '../../errors/index.js';
import { requireAddress, requireNonNegativeInteger } from '../assert.js';
import {
  createImplCall,
  fetchAuthorizationChainId,
  fetchAuthorizationNonce,
  finalizeSignedAuthorizationResult,
  toChecksumAddress
} from './index.js';
import { log } from '../logger.js';

/**
 * Dependencies injected from {@link Monstera} (or tests).
 * {@code fallbackProvider} should be {@code readProvider ?? writeSigner?.provider} so readonly SDK instances (no signer) still get RPC for chain/nonce resolution.
 *
 * @typedef {{
 *   keyVault: KeyVaultClient;
 *   fallbackProvider: EthersAbstractProvider | null;
 * }} SignAuthorizationDeps
 */

/**
 * Validate options, resolve chainId / authority / nonce via RPC when omitted, build {@code implCall} bytes.
 *
 * @param {SignAuthorizationDeps} deps
 * @param {EncodeAuthProofOptionsResult} encodedAuthProofObject - Object after {@link encodeAuthProofOptions}
 * @param {SignAuthorizationOptions} options
 * @returns {Promise<ResolvedSignAuthorizationInputs>}
 */
async function resolveSignAuthorizationInputs(deps, encodedAuthProofObject, options = {}) {
  const { keyVault, fallbackProvider } = deps;
  const { keyVaultAddr, delegateAddr, provider } = options;

  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requireAddress(delegateAddr, 'delegateAddr');
  const checksummedDelegateAddr = toChecksumAddress(delegateAddr);

  // set index default to 0 if not provided
  const index = options.index !== undefined && options.index !== null ? options.index : 0;
  requireNonNegativeInteger(index, 'index');

  const needsChainId = options.chainId === undefined || options.chainId === null;
  const needsNonce = options.nonce === undefined || options.nonce === null;
  const targetProvider = provider ?? fallbackProvider ?? null;

  // if chainId or nonce is not provided, provider is required
  if ((needsChainId || needsNonce) && !targetProvider) {
    throw new ValidationError(
      'provider is required to resolve chainId and/or nonce (pass options.provider, or construct Monstera with rpcUrl/readProvider / signer.provider)',
      'provider',
      targetProvider
    );
  }

  // set chainId default if not provided
  const chainId = needsChainId
    ? await fetchAuthorizationChainId(targetProvider)
    : BigInt(options.chainId);

  // get authority address at index
  const authorityAddr = await keyVault.getAccountAddr({ keyVaultAddr, index });

  // set nonce default if not provided
  const nonce = needsNonce
    ? await fetchAuthorizationNonce(targetProvider, authorityAddr)
    : BigInt(options.nonce);

  // build implementation call - encode the implementation call
  const implCall = createImplCall({
    index,
    delegateAddr: checksummedDelegateAddr,
    nonce,
    chainId
  });

  return {
    keyVaultAddr,
    authProof: encodedAuthProofObject.authProof,
    implCall,
    delegateAddr: checksummedDelegateAddr,
    nonce,
    chainId
  };
}

/**
 * Resolve delegate address, optional chain/nonce via RPC, build impl call, {@code executeWithAuth}, assemble result.
 *
 * @param {SignAuthorizationDeps} deps
 * @param {EncodeAuthProofOptionsResult} encodedAuthProofObject - Object after {@link encodeAuthProofOptions}
 * @param {SignAuthorizationOptions} options
 * @returns {Promise<SignedAuthorizationResult>}
 */
async function executeSignAuthorization(deps, encodedAuthProofObject, options = {}) {
  const { keyVault } = deps;
  const resolved = await resolveSignAuthorizationInputs(deps, encodedAuthProofObject, options);

  log.debug('Build implementation call, about to execute with auth');

  const raw = await keyVault.executeWithAuth({
    keyVaultAddr: resolved.keyVaultAddr,
    authProof: resolved.authProof,
    implCall: resolved.implCall
  });

  return finalizeSignedAuthorizationResult({
    delegateAddr: resolved.delegateAddr,
    nonce: resolved.nonce,
    chainId: resolved.chainId,
    raw
  });
}

export { executeSignAuthorization };
