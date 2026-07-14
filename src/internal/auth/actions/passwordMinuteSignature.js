/**
 * PasswordMinuteSignatureAuthenticator management action builders.
 *
 * @module internal/auth/actions/passwordMinuteSignature
 */

import { PASSWORD_MINUTE_SIGNATURE_AUTHENTICATOR_ABI } from '../../../contracts/abi/authenticators/passwordMinuteSignatureAuthenticator.js';
import { buildManagementAction } from '../context/actionContext.js';

/**
 * @public
 * @param {Address} target - PasswordMinuteSignatureAuthenticator address
 * @param {Bytes32} newPasswordHash
 * @returns {AuthActionInput}
 */
function buildChangePasswordAction(target, newPasswordHash) {
  return buildManagementAction(
    PASSWORD_MINUTE_SIGNATURE_AUTHENTICATOR_ABI,
    'changePassword',
    ['bytes32'],
    [newPasswordHash],
    target
  );
}

export { buildChangePasswordAction };
