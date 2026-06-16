/**
 * Helpers for action-scoped auth proofs.
 *
 * KeyVault {@code actionHash} is fetched on-chain via {@code computeActionHash}. Authenticator
 * {@code actionHash} is derived off-chain using the same formula as
 * {@code DualFactorAuthenticator._buildContext} (the contract has no public view helper).
 *
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../types/index.js').Bytes4} Bytes4
 * @typedef {import('../../types/index.js').ChainId} ChainId
 * @typedef {import('../../types/index.js').AuthContext} AuthContext
 * @typedef {import('../../types/index.js').AuthActionInput} AuthActionInput
 * @typedef {import('../../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 *
 * @module internal/crypto/authContext
 */

import { defaultAbiCoder } from '../../adapters/ethers/encoding.js';
import { keccak256, toUtf8Bytes } from '../../adapters/ethers/hashing.js';
import { getKeyVaultContract } from '../../contracts/core/keyVault.js';
import { requireAddress, requireBytes32, requireBytes4, requireChainId } from '../assert.js';
import { ValidationError } from '../../errors/index.js';

/** @type {Bytes32} */
const AUTH_CONTEXT_TYPEHASH = keccak256(toUtf8Bytes('MONSTERA_AUTH_CONTEXT_V1'));

/**
 * Hash user-controlled parameters for a vault / authenticator call (excluding {@code authProof}).
 *
 * @public
 * @param {string[]} types - ABI types passed to {@code abi.encode}
 * @param {unknown[]} values - Values aligned with {@code types}
 * @returns {Bytes32} {@code keccak256(abi.encode(...))}
 */
function computeParamsHash(types, values) {
  return keccak256(defaultAbiCoder.encode(types, values));
}

/**
 * Validate caller-supplied action input ({@code selector} + {@code paramsHash}, optional {@code target}).
 *
 * @public
 * @param {AuthActionInput} action
 * @throws {ValidationError}
 */
function assertAuthActionInput(action) {
  if (!action || typeof action !== 'object' || Array.isArray(action)) {
    throw new ValidationError('action is required', 'action', action);
  }

  requireBytes32(action.paramsHash, 'action.paramsHash');
  requireBytes4(action.selector, 'action.selector');

  if (action.target != null) {
    requireAddress(action.target, 'action.target');
  }
}

/**
 * Assemble a full {@link AuthContext} once {@code actionHash} is known.
 *
 * @public
 * @param {Object} params
 * @param {Address} params.target - Executing contract
 * @param {Bytes4} params.selector - 4-byte function selector
 * @param {Bytes32} params.paramsHash - Hashed call parameters
 * @param {Bytes32} params.actionHash - Canonical action hash
 * @returns {AuthContext}
 */
function buildAuthContext({ target, selector, paramsHash, actionHash }) {
  requireAddress(target, 'target');
  requireBytes4(selector, 'selector');
  requireBytes32(paramsHash, 'paramsHash');
  requireBytes32(actionHash, 'actionHash');
  return { target, selector, paramsHash, actionHash };
}

/**
 * Fetch {@code actionHash} from a KeyVault ({@code target = vault}).
 *
 * @public
 * @async
 * @param {Object} params
 * @param {EthersAbstractProvider} params.readProvider - RPC provider for view calls
 * @param {Address} params.keyVaultAddr - Wallet KeyVault address
 * @param {Bytes4} params.selector - 4-byte function selector
 * @param {Bytes32} params.paramsHash - Hashed call parameters
 * @returns {Promise<Bytes32>}
 */
async function fetchKeyVaultActionHash({ readProvider, keyVaultAddr, selector, paramsHash }) {
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requireBytes4(selector, 'selector');
  requireBytes32(paramsHash, 'paramsHash');

  const keyVault = getKeyVaultContract(readProvider, keyVaultAddr);
  return keyVault.computeActionHash(selector, paramsHash);
}

/**
 * Resolve the canonical {@code actionHash} for a vault or authenticator call.
 *
 * @description When {@code actionHash} is supplied it is validated and returned as-is. Otherwise
 * {@code action} must be present: vault-targeted actions fetch the hash on-chain via
 * {@link fetchKeyVaultActionHash}; authenticator-targeted actions derive it off-chain via
 * {@link computeAuthenticatorActionHash}.
 *
 * @public
 * @async
 * @param {Object} ctx
 * @param {EthersAbstractProvider} ctx.readProvider - RPC provider for view calls
 * @param {ChainId} ctx.chainId - Chain id for off-chain authenticator hashes
 * @param {Address} ctx.keyVaultAddr - Wallet KeyVault address
 * @param {Object} input
 * @param {AuthActionInput} [input.action] - Action descriptor ({@code selector}, {@code paramsHash}, optional {@code target})
 * @param {Bytes32} [input.actionHash] - Pre-computed action hash (skips resolution)
 * @returns {Promise<Bytes32>}
 * @throws {ValidationError} If neither {@code action} nor {@code actionHash} is valid
 */
async function resolveActionHash(ctx, { action, actionHash }) {
  if (actionHash != null) {
    requireBytes32(actionHash, 'actionHash');
    return actionHash;
  }

  assertAuthActionInput(action);
  const target = action.target ?? ctx.keyVaultAddr;
  const { selector, paramsHash } = action;

  if (target.toLowerCase() === ctx.keyVaultAddr.toLowerCase()) {
    return fetchKeyVaultActionHash({
      readProvider: ctx.readProvider,
      keyVaultAddr: ctx.keyVaultAddr,
      selector,
      paramsHash
    });
  }

  return computeAuthenticatorActionHash({
    readProvider: ctx.readProvider,
    chainId: ctx.chainId,
    authenticatorAddr: target,
    keyVaultAddr: ctx.keyVaultAddr,
    selector,
    paramsHash
  });
}

/**
 * Compute {@code actionHash} for {@code DualFactorAuthenticator} management calls off-chain.
 *
 * Mirrors {@code DualFactorAuthenticator._buildContext}:
 * {@code keccak256(abi.encode(MONSTERA_AUTH_CONTEXT_V1, chainId, wallet, authenticator, selector, paramsHash))}.
 *
 * @public
 * @async
 * @param {Object} params
 * @param {EthersAbstractProvider} [params.readProvider] - Used to read {@code chainId} when omitted
 * @param {ChainId} [params.chainId] - Chain id (defaults via {@code readProvider.getNetwork()})
 * @param {Address} params.authenticatorAddr - DualFactorAuthenticator address ({@code target})
 * @param {Address} params.keyVaultAddr - Wallet KeyVault address
 * @param {Bytes4} params.selector - 4-byte function selector
 * @param {Bytes32} params.paramsHash - Hashed call parameters
 * @returns {Promise<Bytes32>}
 */
async function computeAuthenticatorActionHash({
  readProvider,
  chainId,
  authenticatorAddr,
  keyVaultAddr,
  selector,
  paramsHash
}) {
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requireBytes4(selector, 'selector');
  requireBytes32(paramsHash, 'paramsHash');

  let resolvedChainId = chainId;
  if (resolvedChainId == null) {
    if (!readProvider || typeof readProvider.getNetwork !== 'function') {
      throw new ValidationError(
        'chainId or readProvider with getNetwork is required',
        'chainId',
        chainId
      );
    }
    const network = await readProvider.getNetwork();
    resolvedChainId = network.chainId;
  } else {
    resolvedChainId = requireChainId(resolvedChainId, 'chainId');
  }

  return keccak256(
    defaultAbiCoder.encode(
      ['bytes32', 'uint256', 'address', 'address', 'bytes4', 'bytes32'],
      [AUTH_CONTEXT_TYPEHASH, resolvedChainId, keyVaultAddr, authenticatorAddr, selector, paramsHash]
    )
  );
}

export {
  AUTH_CONTEXT_TYPEHASH,
  computeParamsHash,
  assertAuthActionInput,
  buildAuthContext,
  fetchKeyVaultActionHash,
  computeAuthenticatorActionHash,
  resolveActionHash
};
