/**
 * WalletSignatureAuthenticator management action builders.
 *
 * @module internal/auth/actions/walletSignature
 */

import { WALLET_SIGNATURE_AUTHENTICATOR_ABI } from '../../../contracts/abi/authenticators/walletSignatureAuthenticator.js';
import { buildManagementAction } from '../context/actionContext.js';

/**
 * @public
 * @param {Address} target - WalletSignatureAuthenticator address
 * @param {Address} addressToAdd
 * @returns {AuthActionInput}
 */
function buildAddToWhitelistAction(target, addressToAdd) {
  return buildManagementAction(
    WALLET_SIGNATURE_AUTHENTICATOR_ABI,
    'addToWhitelist',
    ['address'],
    [addressToAdd],
    target,
    ['addressToAdd']
  );
}

/**
 * @public
 * @param {Address} target - WalletSignatureAuthenticator address
 * @param {Address} addressToRemove
 * @returns {AuthActionInput}
 */
function buildRemoveFromWhitelistAction(target, addressToRemove) {
  return buildManagementAction(
    WALLET_SIGNATURE_AUTHENTICATOR_ABI,
    'removeFromWhitelist',
    ['address'],
    [addressToRemove],
    target,
    ['addressToRemove']
  );
}

export { buildAddToWhitelistAction, buildRemoveFromWhitelistAction };
