/**
 * ApiKeySessionAuthenticator management action builders.
 *
 * @module internal/auth/context/actions/authenticator/apiKeySession
 */

import { API_KEY_SESSION_AUTHENTICATOR_ABI } from '../../../../../contracts/abi/authenticators/apiKeySessionAuthenticator.js';
import { buildManagementAction } from '../../createAuthContext.js';

/**
 * Build the ACTION-bound management action for {@code rotateApiKey(wallet, authProof, newSecret)}.
 *
 * @public
 * @param {Address} target - ApiKeySessionAuthenticator address
 * @param {Bytes32} newApiKeySecret - {@code keccak256(newApiKey)} stored on-chain after rotation
 * @returns {AuthActionInput}
 */
function buildRotateApiKeyAction(target, newApiKeySecret) {
  return buildManagementAction(
    API_KEY_SESSION_AUTHENTICATOR_ABI,
    'rotateApiKey',
    ['bytes32'],
    [newApiKeySecret],
    target
  );
}

export { buildRotateApiKeyAction };
