/**
 * Canonical action for on-chain authenticator {@code verify} sanity checks.
 *
 * On-chain {@code is*Valid} sanity checks do not authorize a specific KeyVault call. The
 * contracts still require an action-bound proof, so the SDK uses a stable probe action:
 * {@code IAuthenticator.verify} with {@code paramsHash = bytes32(0)} and
 * {@code target = authenticatorAddr}.
 *
 * @module internal/auth/context/actions/authenticator/authenticatorProbe
 */

import { I_AUTHENTICATOR_ABI } from '../../../../../contracts/abi/interfaces/iAuthenticator.js';
import { getSelector } from '../../../../vault/getSelector.js';

/** @type {Bytes32} */
const VERIFY_PROBE_PARAMS_HASH = `0x${'00'.repeat(32)}`;

/**
 * @public
 * @returns {Bytes4} {@code verify(address,AuthContext,bytes)} selector
 */
function getVerifySelector() {
  return getSelector(I_AUTHENTICATOR_ABI, 'verify');
}

/**
 * Build the SDK's canonical verify-only probe action for a wallet authenticator.
 *
 * @public
 * @param {Address} authenticatorAddr - Authenticator contract address ({@code target})
 * @returns {AuthActionInput}
 */
function buildAuthenticatorVerifyProbeAction(authenticatorAddr) {
  return {
    target: authenticatorAddr,
    selector: getVerifySelector(),
    paramsHash: VERIFY_PROBE_PARAMS_HASH
  };
}

export {
  VERIFY_PROBE_PARAMS_HASH,
  getVerifySelector,
  buildAuthenticatorVerifyProbeAction
};
