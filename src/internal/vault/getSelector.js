/**
 * Resolve a 4-byte function selector from a contract ABI fragment list.
 *
 * @typedef {import('../../types/index.js').Bytes4} Bytes4
 *
 * @module internal/crypto/getSelector
 */

import { Interface } from '../../adapters/ethers/encoding.js';
import { ValidationError } from '../../errors/index.js';

/**
 * Look up {@code functionName} in {@code abi} and return its selector.
 *
 * @public
 * @param {ReadonlyArray<object>} abi - Contract ABI fragments
 * @param {string} functionName - Solidity function name (e.g. {@code 'changePassword'})
 * @returns {Bytes4} 4-byte selector hex string
 * @throws {ValidationError} If the function is not present in the ABI
 */
function getSelector(abi, functionName) {
  const iface = new Interface(abi);
  const fragment = iface.getFunction(functionName, null);
  if (!fragment) {
    throw new ValidationError(
      `Function "${functionName}" not found in ABI`,
      'functionName',
      functionName
    );
  }
  return fragment.selector;
}

export { getSelector };
