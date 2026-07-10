/**
 * MultiAuthenticator management action builders.
 *
 * @module internal/auth/context/actions/authenticator/multi
 */

import { keccak256 } from '../../../../../adapters/ethers/hashing.js';
import { MULTI_AUTHENTICATOR_ABI } from '../../../../../contracts/abi/authenticators/multiAuthenticator.js';
import { buildManagementAction } from '../../createAuthContext.js';

/**
 * Build the ACTION-bound management action for {@code addAuthenticator(wallet, authProof, child, childConfig)}.
 *
 * @public
 * @param {Address} target - MultiAuthenticator address
 * @param {Address} child - Child authenticator to enable
 * @param {Bytes} childConfig - ABI-encoded config forwarded to the child
 * @returns {AuthActionInput}
 */
function buildAddAuthenticatorAction(target, child, childConfig) {
  return buildManagementAction(
    MULTI_AUTHENTICATOR_ABI,
    'addAuthenticator',
    ['address', 'bytes32'],
    [child, keccak256(childConfig)],
    target
  );
}

/**
 * Build the ACTION-bound management action for {@code removeAuthenticator(wallet, authProof, child)}.
 *
 * @public
 * @param {Address} target - MultiAuthenticator address
 * @param {Address} child - Child authenticator to disable
 * @returns {AuthActionInput}
 */
function buildRemoveAuthenticatorAction(target, child) {
  return buildManagementAction(
    MULTI_AUTHENTICATOR_ABI,
    'removeAuthenticator',
    ['address'],
    [child],
    target
  );
}

export { buildAddAuthenticatorAction, buildRemoveAuthenticatorAction };
