/**
 * High-level orchestration for {@code Monstera.signAuthorization}.
 *
 * Keeps the Monstera facade thin: validation and ethers usage live here and in
 * {@link ./authorization.js}. The flow is:
 * 1. Validate caller options and apply defaults
 * 2. Resolve any missing {@code chainId} / authority {@code nonce} via the read provider
 * 3. Encode the {@code implCall} bytes for KeyVault
 * 4. Encode an action-bound {@code authProof} for {@code executeWithAuth}
 * 5. Call {@code KeyVaultClient.executeWithAuth} with the encoded auth proof
 * 6. Decode the {@code (r, s, yParity)} return blob and assemble the public result
 *
 * @typedef {import('../../clients/keyVault/KeyVaultClient.js').default} KeyVaultClient
 *
 * @module internal/crypto/signAuthorization
 */

import { ValidationError } from '../../errors/index.js';
import { requireAddress, requireBigInt, requireChainId, requireNonNegativeInteger } from '../assert.js';
import { CredentialsSession } from '../auth/session/CredentialsSession.js';
import {
  createImplCall,
  fetchAuthorizationChainId,
  fetchAuthorizationNonce,
  finalizeSignedAuthorizationResult,
  toChecksumAddress
} from './authorization.js';
import { withDefaultAccountIndex } from './accountIndex.js';
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
 *   credentialsSession: import('../auth/session/CredentialsSession.js').CredentialsSession | null;
 *   encodeVaultAuthProof: (
 *     options: SignAuthorizationOptions & { implCall: Bytes },
 *     buildAction: (options: SignAuthorizationOptions & { implCall: Bytes }) => AuthActionInput
 *   ) => Promise<EncodeAuthProofOptionsResult>;
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
 * @param {SignAuthorizationOptions} [options={}] - Caller options ({@code keyVaultAddr},
 *   {@code delegateAddr}, optional {@code index}, {@code chainId}, {@code nonce}, {@code provider})
 * @returns {Promise<ResolvedSignAuthorizationInputs>} Fully resolved inputs ready to feed into
 *   {@code executeWithAuth}
 * @throws {ValidationError} If {@code keyVaultAddr} / {@code delegateAddr} are missing/invalid,
 *   {@code index} is not a non-negative integer, {@code chainId} is invalid, {@code nonce} is
 *   negative, or {@code provider} is required (chain id / nonce missing) but not available
 * @throws {CredentialsRequiredError} If {@code keyVaultAddr} is omitted and no credentials session is active
 * @throws {WalletError} Forwarded from {@link fetchAuthorizationChainId},
 *   {@link fetchAuthorizationNonce}, or {@code keyVault.getAccountAddr} (e.g.
 *   {@link NetworkError}, {@link ContractRevertError})
 */
async function resolveSignAuthorizationInputs(deps, options = {}) {
  const { keyVault, fallbackProvider, credentialsSession } = deps;
  const resolved = await CredentialsSession.resolveVaultOptions(credentialsSession, options);
  const { keyVaultAddr, delegateAddr, provider } = resolved;

  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requireAddress(delegateAddr, 'delegateAddr');
  const checksummedDelegateAddr = toChecksumAddress(delegateAddr);

  const { index } = withDefaultAccountIndex(resolved);
  requireNonNegativeInteger(index, 'index');

  const needsChainId = resolved.chainId === undefined || resolved.chainId === null;
  const needsNonce = resolved.nonce === undefined || resolved.nonce === null;
  const targetProvider = provider ?? fallbackProvider ?? null;

  if ((needsChainId || needsNonce) && !targetProvider) {
    throw new ValidationError(
      'provider is required to resolve chainId and/or nonce (pass options.provider, or construct Monstera with rpcUrl/readProvider / signer.provider)',
      'provider',
      targetProvider
    );
  }

  const chainId = needsChainId
    ? await fetchAuthorizationChainId(targetProvider)
    : BigInt(requireChainId(resolved.chainId, 'chainId'));

  const authorityAddr = await keyVault.getAccountAddr({ keyVaultAddr, index });

  const nonce = needsNonce
    ? await fetchAuthorizationNonce(targetProvider, authorityAddr)
    : requireBigInt(resolved.nonce, 'nonce', { allowNegative: false });

  const implCall = createImplCall({
    index,
    delegateAddr: checksummedDelegateAddr,
    nonce,
    chainId
  });

  return {
    keyVaultAddr,
    implCall,
    delegateAddr: checksummedDelegateAddr,
    nonce,
    chainId
  };
}

/**
 * End-to-end orchestration for {@code Monstera.signAuthorization}.
 *
 * @description Resolves {@code implCall} first, encodes an action-bound auth proof for
 * {@code executeWithAuth}, calls {@code KeyVaultClient.executeWithAuth}, and assembles the public
 * {@link SignedAuthorizationResult} from the raw return blob.
 *
 * @public
 * @async
 * @param {SignAuthorizationDeps} deps - Injected dependencies (KeyVault client, fallback provider, encode helper)
 * @param {SignAuthorizationOptions} [options={}] - Caller options
 * @param {(options: SignAuthorizationOptions & { implCall: Bytes }) => AuthActionInput} buildExecuteWithAuthAction -
 *   Builds the vault action for {@code executeWithAuth}
 * @returns {Promise<SignedAuthorizationResult>} Authorization tuple + decoded split signature
 * @throws {ValidationError} Forwarded from {@link resolveSignAuthorizationInputs}
 * @throws {WalletError} Forwarded from any underlying read / write call (e.g.
 *   {@link NetworkError}, {@link ContractRevertError}, {@link WriteRequiresSignerError})
 */
async function executeSignAuthorization(deps, options = {}, buildExecuteWithAuthAction) {
  const { keyVault, encodeVaultAuthProof } = deps;
  const resolved = await resolveSignAuthorizationInputs(deps, options);

  log.debug('Build implementation call, about to encode auth proof and execute with auth');

  const encoded = await encodeVaultAuthProof(
    { ...options, implCall: resolved.implCall },
    buildExecuteWithAuthAction
  );

  const raw = await keyVault.executeWithAuth({
    keyVaultAddr: resolved.keyVaultAddr,
    authProof: encoded.authProof,
    implCall: resolved.implCall
  });

  return finalizeSignedAuthorizationResult({
    delegateAddr: resolved.delegateAddr,
    nonce: resolved.nonce,
    chainId: resolved.chainId,
    raw
  });
}

export { executeSignAuthorization, resolveSignAuthorizationInputs };
