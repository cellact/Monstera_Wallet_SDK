/**
 * DualFactorAuthenticator management action builders.
 *
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').AuthActionInput} AuthActionInput
 * @typedef {import('../../../types/index.js').Bytes32} Bytes32
 *
 * @module internal/auth/context/actions/authenticator/dualFactor
 */

import { DUAL_FACTOR_AUTHENTICATOR_ABI } from '../../../../../contracts/abi/authenticators/dualFactorAuthenticator.js';
import { buildManagementAction } from '../../createAuthContext.js';

/**
 * @public
 * @param {Address} target - DualFactorAuthenticator address
 * @param {Bytes32} newPasswordHash
 * @returns {AuthActionInput}
 */
function buildChangePasswordAction(target, newPasswordHash) {
  return buildManagementAction(
    DUAL_FACTOR_AUTHENTICATOR_ABI,
    'changePassword',
    ['bytes32'],
    [newPasswordHash],
    target
  );
}

/**
 * @public
 * @param {Address} target - DualFactorAuthenticator address
 * @param {Address} newGuardian
 * @returns {AuthActionInput}
 */
function buildChangeGuardianAction(target, newGuardian) {
  return buildManagementAction(
    DUAL_FACTOR_AUTHENTICATOR_ABI,
    'changeGuardian',
    ['address'],
    [newGuardian],
    target
  );
}

export { buildChangePasswordAction, buildChangeGuardianAction };
