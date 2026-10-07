/**
 * Shared EIP-712 signing for action-bound authenticator proofs.
 *
 * Pure typed-data signing lives in {@code internal/crypto/eip712.js}; this module owns the
 * Monstera action-auth struct layout and auth-proof error context.
 *
 * @module internal/auth/proof/signing/eip712
 */

import { signTypedData } from '../../../crypto/eip712.js';
import { sdkErrorPipeline } from '../../../../errors/pipeline.js';

/** Shared EIP-712 field layout for action-bound authenticator proofs. */
export const ACTION_AUTH_EIP712_FIELDS = [
  { name: 'wallet', type: 'address' },
  { name: 'actionHash', type: 'bytes32' },
  { name: 'deadline', type: 'uint256' }
];

/**
 * Sign an EIP-712 action-bound authenticator proof and return encoded output bytes.
 *
 * @param {Object} params
 * @param {TypedDataSigner} params.signer
 * @param {string} params.contractName - EIP-712 domain {@code name}
 * @param {string} params.structName - Primary typed-data struct name
 * @param {ChainId} params.chainId
 * @param {Address} params.verifyingContract
 * @param {Address} params.keyVaultAddr
 * @param {Bytes32} params.actionHash
 * @param {number | bigint} params.deadline
 * @param {string} params.authProofType - Error pipeline label
 * @param {string} params.functionName - Error pipeline label
 * @param {(signature: string) => Bytes} params.encodeOutput
 * @returns {Promise<Bytes>}
 */
export async function signEip712ActionProof({
  signer,
  contractName,
  structName,
  chainId,
  verifyingContract,
  keyVaultAddr,
  actionHash,
  deadline,
  authProofType,
  functionName,
  encodeOutput
}) {
  const domain = {
    name: contractName,
    version: '1',
    chainId,
    verifyingContract
  };
  const types = {
    [structName]: ACTION_AUTH_EIP712_FIELDS
  };
  const value = { wallet: keyVaultAddr, actionHash, deadline };

  try {
    const signature = await signTypedData({ signer, domain, types, value });
    return encodeOutput(signature);
  } catch (error) {
    sdkErrorPipeline.rethrow(error, {
      authProofType,
      functionName,
      validationExtra: { deadline }
    });
  }
}
