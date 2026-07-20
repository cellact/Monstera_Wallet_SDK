/**
 * Resolve a MultiAuthenticator child spec from flow id or on-chain address.
 *
 * Proof routing uses {@code viaChild} / {@code viaChildFlowId} / {@code childFlowId} first.
 * Bare {@code child} is only used when no explicit proof-route fields are set (e.g. vault
 * sign calls). Admin flows such as {@link Monstera#addMultiAuthenticator} also pass
 * {@code child} as the on-chain target; that must not override the authorizing child.
 *
 * @module internal/auth/specs/multiChildResolver
 */

import { getAddress } from '../../../adapters/ethers/addresses.js';
import { ValidationError } from '../../../errors/index.js';
import { requireAddress } from '../../validation/assert.js';
import { CHILD_AUTHENTICATORS } from './registry.js';

/**
 * Lazy maps — {@link CHILD_AUTHENTICATORS} is defined in {@link ./registry.js}, which imports
 * {@code multi.js}, which imports this module. Access the list only after module init.
 *
 * @type {Map<string, BuiltinAuthenticatorSpec> | null}
 */
let childByFlowId = null;

/**
 * @returns {Map<string, BuiltinAuthenticatorSpec>}
 */
function _getChildByFlowId() {
  if (childByFlowId == null) {
    childByFlowId = new Map(CHILD_AUTHENTICATORS.map((spec) => [spec.flowId, spec]));
  }
  return childByFlowId;
}

/**
 * @param {ContractAddresses} addresses
 * @returns {Map<string, BuiltinAuthenticatorSpec>}
 */
function _buildAddressLookup(addresses) {
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
function _resolveAddrFromFlowId(flowId, addresses) {
  const spec = _getChildByFlowId().get(flowId);
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
    return _resolveAddrFromFlowId(/** @type {string} */ (flowId), addresses);
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
  const byAddr = _buildAddressLookup(addresses);
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
  return _getChildByFlowId().get(flowId);
}
