/**
 * PasswordOrWalletSignatureAuthenticator management action builders.
 *
 * @module internal/auth/actions/passwordOrWalletSignature
 */

import { PASSWORD_OR_WALLET_SIGNATURE_AUTHENTICATOR_ABI } from '../../../contracts/abi/authenticators/passwordOrWalletSignatureAuthenticator.js';
import { buildManagementAction } from '../context/actionContext.js';

/**
 * @public
 * @param {Address} target - PasswordOrWalletSignatureAuthenticator address
 * @param {Bytes32} newPasswordHash
 * @returns {AuthActionInput}
 */
function buildPasswordOrWalletChangePasswordAction(target, newPasswordHash) {
  return buildManagementAction(
    PASSWORD_OR_WALLET_SIGNATURE_AUTHENTICATOR_ABI,
    'changePassword',
    ['bytes32'],
    [newPasswordHash],
    target
  );
}

/**
 * @public
 * @param {Address} target - PasswordOrWalletSignatureAuthenticator address
 * @param {Address} addressToAdd
 * @returns {AuthActionInput}
 */
function buildPasswordOrWalletAddToWhitelistAction(target, addressToAdd) {
  return buildManagementAction(
    PASSWORD_OR_WALLET_SIGNATURE_AUTHENTICATOR_ABI,
    'addToWhitelist',
    ['address'],
    [addressToAdd],
    target
  );
}

/**
 * @public
 * @param {Address} target - PasswordOrWalletSignatureAuthenticator address
 * @param {Address} addressToRemove
 * @returns {AuthActionInput}
 */
function buildPasswordOrWalletRemoveFromWhitelistAction(target, addressToRemove) {
  return buildManagementAction(
    PASSWORD_OR_WALLET_SIGNATURE_AUTHENTICATOR_ABI,
    'removeFromWhitelist',
    ['address'],
    [addressToRemove],
    target
  );
}

/**
 * @public
 * @param {Address} target - PasswordOrWalletSignatureAuthenticator address
 * @param {Address} newAddress
 * @param {Bytes32} nonce
 * @param {number | bigint} deadline
 * @returns {AuthActionInput}
 */
function buildPasswordOrWalletAddToWhitelistWithProofAction(target, newAddress, nonce, deadline) {
  return buildManagementAction(
    PASSWORD_OR_WALLET_SIGNATURE_AUTHENTICATOR_ABI,
    'addToWhitelistWithProof',
    ['address', 'bytes32', 'uint256'],
    [newAddress, nonce, deadline],
    target
  );
}

export {
  buildPasswordOrWalletChangePasswordAction,
  buildPasswordOrWalletAddToWhitelistAction,
  buildPasswordOrWalletRemoveFromWhitelistAction,
  buildPasswordOrWalletAddToWhitelistWithProofAction,
};
