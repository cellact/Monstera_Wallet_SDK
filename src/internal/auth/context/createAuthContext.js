/**
 * Action-scoped auth context: {@code paramsHash}, {@code actionHash}, and management actions.
 *
 * KeyVault {@code actionHash} is fetched on-chain via {@code computeActionHash}. Authenticator
 * {@code actionHash} is derived off-chain using the same formula as
 * {@code DualFactorAuthenticator._buildContext}.
 *
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../types/index.js').Bytes4} Bytes4
 * @typedef {import('../../../types/index.js').ChainId} ChainId
 * @typedef {import('../../../types/index.js').AuthContext} AuthContext
 * @typedef {import('../../../types/index.js').AuthActionInput} AuthActionInput
 * @typedef {import('../../../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 *
 * @module internal/auth/context/createAuthContext
 */

import { defaultAbiCoder } from '../../../adapters/ethers/encoding.js';
import { keccak256, toUtf8Bytes } from '../../../adapters/ethers/hashing.js';
import { getKeyVaultContract } from '../../../contracts/core/keyVault.js';
import { requireAddress, requireBytes32, requireBytes4, requireChainId, requirePlainObject, requireProviderMethod } from '../../assert.js';
import { getSelector } from '../../vault/getSelector.js';

/** @type {Bytes32} */
const AUTH_CONTEXT_TYPEHASH = keccak256(toUtf8Bytes('MONSTERA_AUTH_CONTEXT_V1'));

/**
 * Hash user-controlled parameters for a vault / authenticator call (excluding {@code authProof}).
 *
 * @public
 * @param {string[]} types
 * @param {unknown[]} values
 * @returns {Bytes32}
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
  requirePlainObject(action, 'action', { message: 'action is required' });
  requireBytes32(action.paramsHash, 'action.paramsHash');
  requireBytes4(action.selector, 'action.selector');

  if (action.target != null) {
    requireAddress(action.target, 'action.target');
  }
}

/**
 * Build a management call action ({@code target}, {@code selector}, {@code paramsHash}).
 *
 * @public
 * @param {ReadonlyArray<object>} abi
 * @param {string} functionName
 * @param {string[]} paramTypes
 * @param {unknown[]} paramValues
 * @param {Address} target
 * @returns {AuthActionInput}
 */
function buildManagementAction(abi, functionName, paramTypes, paramValues, target) {
  return {
    target,
    selector: getSelector(abi, functionName),
    paramsHash: computeParamsHash(paramTypes, paramValues)
  };
}

/**
 * Assemble a full {@link AuthContext} once {@code actionHash} is known.
 *
 * @public
 * @param {Object} params
 * @param {Address} params.target
 * @param {Bytes4} params.selector
 * @param {Bytes32} params.paramsHash
 * @param {Bytes32} params.actionHash
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
 * @param {EthersAbstractProvider} params.readProvider
 * @param {Address} params.keyVaultAddr
 * @param {Bytes4} params.selector
 * @param {Bytes32} params.paramsHash
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
 * @public
 * @async
 * @param {Object} ctx
 * @param {EthersAbstractProvider} ctx.readProvider
 * @param {ChainId} ctx.chainId
 * @param {Address} ctx.keyVaultAddr
 * @param {Object} input
 * @param {AuthActionInput} [input.action]
 * @param {Bytes32} [input.actionHash]
 * @returns {Promise<Bytes32>}
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
 * Compute {@code actionHash} for authenticator management calls off-chain.
 *
 * @public
 * @async
 * @param {Object} params
 * @param {EthersAbstractProvider} [params.readProvider]
 * @param {ChainId} [params.chainId]
 * @param {Address} params.authenticatorAddr
 * @param {Address} params.keyVaultAddr
 * @param {Bytes4} params.selector
 * @param {Bytes32} params.paramsHash
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
    requireProviderMethod(readProvider, 'getNetwork', 'chainId', {
      message: 'chainId or readProvider with getNetwork is required'
    });
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
  buildManagementAction,
  buildAuthContext,
  fetchKeyVaultActionHash,
  computeAuthenticatorActionHash,
  resolveActionHash
};
