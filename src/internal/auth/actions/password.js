/**
 * PasswordAuthenticator management action builders.
 *
 * @module internal/auth/actions/password
 */

import { PASSWORD_AUTHENTICATOR_ABI } from '../../../contracts/abi/authenticators/passwordAuthenticator.js';
import { buildManagementAction } from '../actionContext.js';

/**
 * @public
 * @param {Address} target - PasswordAuthenticator address
 * @param {Bytes32} newPasswordHash
 * @returns {AuthActionInput}
 */
function buildChangePasswordAction(target, newPasswordHash) {
  return buildManagementAction(
    PASSWORD_AUTHENTICATOR_ABI,
    'changePassword',
    ['bytes32'],
    [newPasswordHash],
    target
  );
}

export { buildChangePasswordAction };
