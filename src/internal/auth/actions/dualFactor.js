/**
 * DualFactorAuthenticator management action builders.
 *
 * @module internal/auth/actions/dualFactor
 */

import { DUAL_FACTOR_AUTHENTICATOR_ABI } from '../../../contracts/abi/authenticators/dualFactorAuthenticator.js';
import { buildManagementAction } from '../context/actionContext.js';

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
    target,
    ['newPasswordHash']
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
    target,
    ['newGuardian']
  );
}

export { buildChangePasswordAction, buildChangeGuardianAction };
