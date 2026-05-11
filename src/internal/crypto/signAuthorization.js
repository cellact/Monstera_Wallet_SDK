/**
 * High-level orchestration for {@code Monstera.signAuthorization}.
 *
 * Keeps the Monstera facade thin: validation and ethers usage live here and in
 * {@link ./authorization.js}. The flow is:
 * 1. Validate caller options and apply defaults
 * 2. Resolve any missing {@code chainId} / authority {@code nonce} via the read provider
 * 3. Encode the {@code implCall} bytes for KeyVault
 * 4. Call {@code KeyVaultClient.executeWithAuth} with the encoded auth proof
 * 5. Decode the {@code (r, s, yParity)} return blob and assemble the public result
 *
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').SignedAuthorizationResult} SignedAuthorizationResult
 * @typedef {import('../../types/index.js').SignAuthorizationOptions} SignAuthorizationOptions
 * @typedef {import('../../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 * @typedef {import('../../clients/keyVault/KeyVaultClient.js').default} KeyVaultClient
 * @typedef {import('../../types/index.js').EncodeAuthProofOptionsResult} EncodeAuthProofOptionsResult
 * @typedef {import('../../types/index.js').ResolvedSignAuthorizationInputs} ResolvedSignAuthorizationInputs
 *
 * @module internal/crypto/signAuthorization
 */

import { ValidationError } from '../../errors/index.js';
import { requireAddress, requireBigInt, requireChainId, requireNonNegativeInteger } from '../assert.js';
import {
  createImplCall,
  fetchAuthorizationChainId,
  fetchAuthorizationNonce,
  finalizeSignedAuthorizationResult,
  toChecksumAddress
} from './index.js';
import { log } from '../logger.js';

/**
 * Dependency bundle injected from {@code Monstera} (or tests).
 *
 * @description {@code fallbackProvider} should be {@code readProvider ?? writeSigner?.provider}
 * so readonly SDK instances (no signer) still get an RPC connection for chain id / nonce
 * resolution.
 *
 * @typedef {{
 *   keyVault: KeyVaultClient;
 *   fallbackProvider: EthersAbstractProvider | null;
 * }} SignAuthorizationDeps
 */

/**
 * Validate the caller options and resolve every input needed to call
 * {@code KeyVaultClient.executeWithAuth}.
 *
 * @description Pulls {@code authorityAddr} from {@code keyVault.getAccountAddr} for the requested
 * {@code index}; reads {@code chainId} / {@code nonce} from the provider when the caller did not
 * supply them; encodes the {@code signAuthorizationImpl} calldata.
 *
 * @private
 * @async
 * @param {SignAuthorizationDeps} deps - Injected dependencies
 * @param {EncodeAuthProofOptionsResult} encodedAuthProofObject - Result of running the auth proof
 *   builder over the caller's auth-proof input
 * @param {SignAuthorizationOptions} [options={}] - Caller options ({@code keyVaultAddr},
 *   {@code delegateAddr}, optional {@code index}, {@code chainId}, {@code nonce}, {@code provider})
 * @returns {Promise<ResolvedSignAuthorizationInputs>} Fully resolved inputs ready to feed into
 *   {@code executeWithAuth}
 * @throws {ValidationError} If {@code keyVaultAddr} / {@code delegateAddr} are missing/invalid,
 *   {@code index} is not a non-negative integer, {@code chainId} is invalid, {@code nonce} is
 *   negative, or {@code provider} is required (chain id / nonce missing) but not available
 * @throws {WalletError} Forwarded from {@link fetchAuthorizationChainId},
 *   {@link fetchAuthorizationNonce}, or {@code keyVault.getAccountAddr} (e.g.
 *   {@link NetworkError}, {@link ContractRevertError})
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
    : BigInt(requireChainId(options.chainId, 'chainId'));

  // get authority address at index
  const authorityAddr = await keyVault.getAccountAddr({ keyVaultAddr, index });

  // set nonce default if not provided
  const nonce = needsNonce
    ? await fetchAuthorizationNonce(targetProvider, authorityAddr)
    : requireBigInt(options.nonce, 'nonce', { allowNegative: false });

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
 * End-to-end orchestration for {@code Monstera.signAuthorization}.
 *
 * @description Resolves all inputs via {@link resolveSignAuthorizationInputs}, calls
 * {@code KeyVaultClient.executeWithAuth} with the encoded auth proof + impl call, and assembles
 * the public {@link SignedAuthorizationResult} from the raw return blob.
 *
 * @public
 * @async
 * @param {SignAuthorizationDeps} deps - Injected dependencies (KeyVault client, fallback provider)
 * @param {EncodeAuthProofOptionsResult} encodedAuthProofObject - Result of running the auth proof
 *   builder over the caller's auth-proof input
 * @param {SignAuthorizationOptions} [options={}] - Caller options
 * @returns {Promise<SignedAuthorizationResult>} Authorization tuple + decoded split signature
 * @throws {ValidationError} Forwarded from {@link resolveSignAuthorizationInputs}
 * @throws {WalletError} Forwarded from any underlying read / write call (e.g.
 *   {@link NetworkError}, {@link ContractRevertError}, {@link WriteRequiresSignerError})
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
