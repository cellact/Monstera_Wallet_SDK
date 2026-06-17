/**
 * KeyVaultV3 action helpers: selectors and {@code paramsHash} builders for authenticated vault calls.
 *
 * Each {@code build*} mirrors the corresponding {@code _buildAuthContext} call in {@code KeyVaultV3.sol}.
 *
 * @typedef {import('../../../types/index.js').Address} Address
 * @typedef {import('../../../types/index.js').AuthActionInput} AuthActionInput
 * @typedef {import('../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../types/index.js').Bytes4} Bytes4
 *
 * @module internal/crypto/actions/keyVault
 */

import { keccak256, toUtf8Bytes } from '../../../adapters/ethers/hashing.js';
import { KEYVAULT_ABI } from '../../../contracts/abi/core/keyVault.js';
import { getSelector } from '../getSelector.js';
import { computeParamsHash } from '../../auth/context/createAuthContext.js';
import { requireAddress, requireBytes, requireBytes32, requireNonNegativeInteger, requireString } from '../../assert.js';

/**
 * @private
 * @param {string} functionName
 * @param {Bytes32} paramsHash
 * @returns {AuthActionInput}
 */
function buildVaultAction(functionName, paramsHash) {
  return {
    selector: getSelector(KEYVAULT_ABI, functionName),
    paramsHash
  };
}

/**
 * @private
 * @param {Bytes} bytes
 * @returns {Bytes32}
 */
function hashBytes(bytes) {
  requireBytes(bytes, 'bytes');
  return keccak256(bytes);
}

/**
 * @public
 * @param {{ index: number; digest: Bytes32 }} params
 * @returns {AuthActionInput}
 */
function buildSignAction({ index, digest }) {
  requireNonNegativeInteger(index, 'index');
  requireBytes32(digest, 'digest');
  return buildVaultAction('sign', computeParamsHash(['uint32', 'bytes32'], [index, digest]));
}

/**
 * @public
 * @param {{ index: number; message: Bytes }} params
 * @returns {AuthActionInput}
 */
function buildSignMessageAction({ index, message }) {
  requireNonNegativeInteger(index, 'index');
  requireBytes(message, 'message');
  return buildVaultAction(
    'signMessage',
    computeParamsHash(['uint32', 'bytes32'], [index, hashBytes(message)])
  );
}

/**
 * @public
 * @param {Object} params
 * @param {number} params.index
 * @param {bigint | number} params.nonce
 * @param {bigint | number} params.gasPrice
 * @param {bigint | number} params.gasLimit
 * @param {Address} params.to
 * @param {bigint | number} params.value
 * @param {Bytes} params.txData
 * @param {bigint | number} params.chainId
 * @returns {AuthActionInput}
 */
function buildSignTransactionAction({ index, nonce, gasPrice, gasLimit, to, value, txData, chainId }) {
  requireNonNegativeInteger(index, 'index');
  requireBytes(txData, 'txData');
  return buildVaultAction(
    'signTransaction',
    computeParamsHash(
      ['uint32', 'uint256', 'uint256', 'uint256', 'address', 'uint256', 'bytes32', 'uint256'],
      [index, nonce, gasPrice, gasLimit, to, value, hashBytes(txData), chainId]
    )
  );
}

/**
 * @public
 * @param {{ implCall: Bytes }} params
 * @returns {AuthActionInput}
 */
function buildExecuteWithAuthAction({ implCall }) {
  requireBytes(implCall, 'implCall');
  return buildVaultAction('executeWithAuth', keccak256(implCall));
}

/**
 * @public
 * @param {{ newImplAddr: Address }} params
 * @returns {AuthActionInput}
 */
function buildUpgradeImplementationAction({ newImplAddr }) {
  requireAddress(newImplAddr, 'newImplAddr');
  return buildVaultAction(
    'upgradeImplementation',
    computeParamsHash(['address'], [newImplAddr])
  );
}

/**
 * @public
 * @param {{ newImplAddr: Address; customAckHash: Bytes32 }} params
 * @returns {AuthActionInput}
 */
function buildUpgradeImplementationCustomAction({ newImplAddr, customAckHash }) {
  requireAddress(newImplAddr, 'newImplAddr');
  requireBytes32(customAckHash, 'customAckHash');
  return buildVaultAction(
    'upgradeImplementationCustom',
    computeParamsHash(['address', 'bytes32'], [newImplAddr, customAckHash])
  );
}

/**
 * @public
 * @param {{ newAuthenticatorAddr: Address; newAuthConfig: Bytes }} params
 * @returns {AuthActionInput}
 */
function buildChangeAuthenticatorAction({ newAuthenticatorAddr, newAuthConfig }) {
  requireAddress(newAuthenticatorAddr, 'newAuthenticatorAddr');
  requireBytes(newAuthConfig, 'newAuthConfig');
  return buildVaultAction(
    'changeAuthenticator',
    computeParamsHash(['address', 'bytes32'], [newAuthenticatorAddr, hashBytes(newAuthConfig)])
  );
}

/**
 * @public
 * @param {{ newAuthenticatorAddr: Address; newAuthConfig: Bytes; customAckHash: Bytes32 }} params
 * @returns {AuthActionInput}
 */
function buildChangeAuthenticatorCustomAction({ newAuthenticatorAddr, newAuthConfig, customAckHash }) {
  requireAddress(newAuthenticatorAddr, 'newAuthenticatorAddr');
  requireBytes(newAuthConfig, 'newAuthConfig');
  requireBytes32(customAckHash, 'customAckHash');
  const configHash = hashBytes(newAuthConfig);
  return buildVaultAction(
    'changeAuthenticatorCustom',
    computeParamsHash(['address', 'bytes32', 'bytes32'], [newAuthenticatorAddr, configHash, customAckHash])
  );
}

/**
 * @public
 * @param {Object} params
 * @param {Bytes32} params.keyId
 * @param {Bytes} params.privateKey
 * @param {Bytes} [params.publicKey]
 * @param {number} params.curve
 * @param {number} params.chain
 * @param {string} params.label
 * @returns {AuthActionInput}
 */
function buildImportKeyAction({ keyId, privateKey, publicKey, curve, chain, label }) {
  requireBytes32(keyId, 'keyId');
  requireBytes(privateKey, 'privateKey');
  requireNonNegativeInteger(curve, 'curve');
  requireNonNegativeInteger(chain, 'chain');
  requireString(label, 'label');
  const publicKeyBytes = publicKey ?? '0x';
  requireBytes(publicKeyBytes, 'publicKey');
  return buildVaultAction(
    'importKey',
    computeParamsHash(
      ['bytes32', 'bytes32', 'bytes32', 'uint8', 'uint8', 'bytes32'],
      [
        keyId,
        hashBytes(privateKey),
        hashBytes(publicKeyBytes),
        curve,
        chain,
        keccak256(toUtf8Bytes(label))
      ]
    )
  );
}

/**
 * @public
 * @param {{ keyId: Bytes32 }} params
 * @returns {AuthActionInput}
 */
function buildDeactivateKeyAction({ keyId }) {
  requireBytes32(keyId, 'keyId');
  return buildVaultAction('deactivateKey', computeParamsHash(['bytes32'], [keyId]));
}

/**
 * @public
 * @param {{ keyId: Bytes32 }} params
 * @returns {AuthActionInput}
 */
function buildActivateKeyAction({ keyId }) {
  requireBytes32(keyId, 'keyId');
  return buildVaultAction('activateKey', computeParamsHash(['bytes32'], [keyId]));
}

/**
 * @public
 * @param {{ keyId: Bytes32; digest: Bytes32 }} params
 * @returns {AuthActionInput}
 */
function buildSignWithImportedKeyAction({ keyId, digest }) {
  requireBytes32(keyId, 'keyId');
  requireBytes32(digest, 'digest');
  return buildVaultAction(
    'signWithImportedKey',
    computeParamsHash(['bytes32', 'bytes32'], [keyId, digest])
  );
}

/**
 * @public
 * @param {{ index: number; message: Bytes }} params
 * @returns {AuthActionInput}
 */
function buildSignSolanaAction({ index, message }) {
  requireNonNegativeInteger(index, 'index');
  requireBytes(message, 'message');
  return buildVaultAction(
    'signSolana',
    computeParamsHash(['uint32', 'bytes32'], [index, hashBytes(message)])
  );
}

/**
 * @public
 * @param {Object} params
 * @param {number} params.chain
 * @param {Bytes} params.basePrivateKey
 * @param {Bytes} params.baseChainCode
 * @returns {AuthActionInput}
 */
function buildSetChainBaseKeysAction({ chain, basePrivateKey, baseChainCode }) {
  requireNonNegativeInteger(chain, 'chain');
  requireBytes(basePrivateKey, 'basePrivateKey');
  requireBytes(baseChainCode, 'baseChainCode');
  return buildVaultAction(
    'setChainBaseKeys',
    computeParamsHash(
      ['uint8', 'bytes32', 'bytes32'],
      [chain, hashBytes(basePrivateKey), hashBytes(baseChainCode)]
    )
  );
}

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
};
