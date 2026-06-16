/**
 * PasswordMinuteSignatureAuthenticator management action builders.
 *
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').AuthActionInput} AuthActionInput
 * @typedef {import('../../../types/index.js').Bytes32} Bytes32
 *
 * @module internal/crypto/actions/passwordMinuteSignature
 */

import { PASSWORD_MINUTE_SIGNATURE_AUTHENTICATOR_ABI } from '../../../contracts/abi/authenticators/passwordMinuteSignatureAuthenticator.js';
import { buildManagementAction } from './managementAction.js';

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
