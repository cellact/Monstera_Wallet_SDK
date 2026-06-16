/**
 * Shared helper for authenticator management call actions.
 *
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').AuthActionInput} AuthActionInput
 *
 * @module internal/crypto/actions/managementAction
 */

import { getSelector } from '../getSelector.js';
import { computeParamsHash } from '../authContext.js';

/**
 * Build a management call action ({@code target}, {@code selector}, {@code paramsHash}).
 *
 * @public
 * @param {ReadonlyArray<object>} abi - Contract ABI fragments
 * @param {string} functionName - Solidity function name
 * @param {string[]} paramTypes - ABI types for {@code paramsHash}
 * @param {unknown[]} paramValues - Values aligned with {@code paramTypes}
 * @param {Address} target - Executing contract (authenticator address)
 * @returns {AuthActionInput}
 */
function buildManagementAction(abi, functionName, paramTypes, paramValues, target) {
  return {
    target,
    selector: getSelector(abi, functionName),
    paramsHash: computeParamsHash(paramTypes, paramValues)
  };
}

export { buildManagementAction };
