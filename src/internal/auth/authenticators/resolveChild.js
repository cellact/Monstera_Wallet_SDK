/**
 * Resolve a MultiAuthenticator child spec from flow id or on-chain address.
 *
 * Proof routing uses {@code viaChild} / {@code viaChildFlowId} / {@code childFlowId} first.
 * Bare {@code child} is only used when no explicit proof-route fields are set (e.g. vault
 * sign calls). Admin flows such as {@link Monstera#addMultiAuthenticator} also pass
 * {@code child} as the on-chain target; that must not override the authorizing child.
 *
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').ContractAddresses} ContractAddresses
 * @typedef {import('./types.js').BuiltinAuthenticatorSpec} BuiltinAuthenticatorSpec
 *
 * @module internal/auth/authenticators/resolveChild
 */

import { getAddress } from '../../../adapters/ethers/addresses.js';
import { ValidationError } from '../../../errors/index.js';
import { requireAddress } from '../../assert.js';
import { apiKeySessionAuthenticator } from './apiKeySession.js';
import { passwordAuthenticator } from './password.js';
import { passwordMinuteSignatureAuthenticator } from './passwordMinuteSignature.js';
import { walletSignatureAuthenticator } from './walletSignature.js';
import { dualFactorAuthenticator } from './dualFactor.js';

/** @type {readonly BuiltinAuthenticatorSpec[]} */
const CHILD_AUTHENTICATORS = [
  apiKeySessionAuthenticator,
  passwordAuthenticator,
  passwordMinuteSignatureAuthenticator,
  walletSignatureAuthenticator,
  dualFactorAuthenticator
];

/** @type {Map<string, BuiltinAuthenticatorSpec>} */
const byFlowId = new Map(CHILD_AUTHENTICATORS.map((spec) => [spec.flowId, spec]));

/**
 * @param {ContractAddresses} addresses
 * @returns {Map<string, BuiltinAuthenticatorSpec>}
 */
function buildAddressLookup(addresses) {
  /** @type {Map<string, BuiltinAuthenticatorSpec>} */
  const byAddr = new Map();
  for (const spec of CHILD_AUTHENTICATORS) {
    byAddr.set(getAddress(addresses[spec.addressKey]).toLowerCase(), spec);
  }
  return byAddr;
}

/**
 * @param {string} flowId
 * @param {ContractAddresses} addresses
 * @returns {Address}
 */
function resolveAddrFromFlowId(flowId, addresses) {
  const spec = byFlowId.get(flowId);
  if (!spec) {
    throw new ValidationError('Unknown child auth proof flow', 'childFlowId', flowId);
  }

  const addr = addresses[spec.addressKey];
  if (addr == null) {
    throw new ValidationError(
      `Missing contract address for ${spec.addressKey}`,
      spec.addressKey,
      addr
    );
  }

  return getAddress(addr);
}

/**
 * Resolve which child authenticator should produce the inner proof bytes.
 *
 * @param {Record<string, unknown>} input
 * @param {ContractAddresses} addresses
 * @returns {Address}
 */
export function resolveChildAddr(input, addresses) {
  if (input.viaChild != null) {
    requireAddress(input.viaChild, 'viaChild');
    return getAddress(/** @type {string} */ (input.viaChild));
  }

  const flowId = input.viaChildFlowId ?? input.childFlowId;
  if (flowId != null) {
    return resolveAddrFromFlowId(/** @type {string} */ (flowId), addresses);
  }

  if (input.child != null) {
    requireAddress(input.child, 'child');
    return getAddress(/** @type {string} */ (input.child));
  }

  throw new ValidationError(
    'viaChildFlowId, childFlowId, viaChild, or child is required for multi authenticator proofs',
    'childFlowId',
    flowId
  );
}

/**
 * @param {Record<string, unknown>} input
 * @param {ContractAddresses} addresses
 * @returns {BuiltinAuthenticatorSpec}
 */
export function resolveChildSpec(input, addresses) {
  const childAddr = resolveChildAddr(input, addresses);
  const byAddr = buildAddressLookup(addresses);
  const spec = byAddr.get(childAddr.toLowerCase());

  if (!spec) {
    throw new ValidationError(
      'child is not a built-in Monstera authenticator',
      'child',
      childAddr
    );
  }

  return spec;
}

/**
 * @param {string} flowId
 * @returns {BuiltinAuthenticatorSpec | undefined}
 */
export function getChildSpecByFlowId(flowId) {
  return byFlowId.get(flowId);
}
