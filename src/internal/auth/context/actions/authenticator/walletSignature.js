/**
 * WalletSignatureAuthenticator management action builders.
 *
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').AuthActionInput} AuthActionInput
 *
 * @module internal/auth/context/actions/authenticator/walletSignature
 */

import { WALLET_SIGNATURE_AUTHENTICATOR_ABI } from '../../../../../contracts/abi/authenticators/walletSignatureAuthenticator.js';
import { buildManagementAction } from '../../createAuthContext.js';

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
    target
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
    target
  );
}

export { buildAddToWhitelistAction, buildRemoveFromWhitelistAction };
