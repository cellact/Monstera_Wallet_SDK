/**
 * KeyVault domain helpers: selectors, vault action builders, EIP-7702 authorization.
 *
 * @module internal/vault
 */

export { getSelector } from './getSelector.js';
export {
  buildSignAction,
  buildSignMessageAction,
  buildSignTransactionAction,
  buildExecuteWithAuthAction,
  buildUpgradeImplementationAction,
  buildUpgradeImplementationCustomAction,
  buildChangeAuthenticatorAction,
  buildChangeAuthenticatorCustomAction,
  buildImportKeyAction,
  buildDeactivateKeyAction,
  buildActivateKeyAction,
  buildSignWithImportedKeyAction,
  buildSignSolanaAction,
  buildSetChainBaseKeysAction
} from './actions/index.js';
export {
  normalizeAuthorizationTuple,
  hashAuthorization,
  verifyAuthorization,
  fetchAuthorizationChainId,
  fetchAuthorizationNonce
} from '../crypto/eip7702.js';
export { toChecksumAddress } from '../crypto/address.js';
export {
  encodeSignAuthorizationImplCalldata,
  decodeSignAuthorizationResult,
  finalizeSignedAuthorizationResult
} from './eip7702.js';
export { executeSignAuthorization, resolveSignAuthorizationInputs } from './signEip7702Authorization.js';
