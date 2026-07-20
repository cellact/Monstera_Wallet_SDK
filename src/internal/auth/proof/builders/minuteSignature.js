/**
 * PasswordMinuteSignatureAuthenticator auth-proof builder.
 *
 * @module internal/auth/proof/builders/minuteSignature
 */

import { Wallet } from '../../../../adapters/ethers/index.js';
import { defaultAbiCoder } from '../../../../adapters/ethers/encoding.js';
import { getBytes, keccak256, solidityPacked } from '../../../../adapters/ethers/hashing.js';
import { assertMinuteSignatureAuthProofOptions } from '../../../validators/authProofOptions.js';
import { floorTimestampToMinuteBucket } from '../../../utils/time.js';
import { NetworkError } from '../../../../errors/index.js';
import log from '../../../logger.js';

/**
 * @param {CreateAuthProofMinuteSignatureWithProviderOptions} options
 * @param {ChainId} normalizedChainId
 * @param {Bytes32} actionHash
 * @returns {Promise<CreateAuthProofMinuteSignatureResult>}
 */
export async function encodeMinuteSignatureProofPayload(options, normalizedChainId, actionHash) {
  const { provider, keyVaultAddr, authenticatorAddr, passwordHash } = options;

  const block = await provider.getBlock('latest');
  if (!block) {
    throw new NetworkError('Failed to read latest block from provider', null, null);
  }
  const minuteBucket = floorTimestampToMinuteBucket(block.timestamp);

  const minuteSeed = keccak256(
    solidityPacked(['bytes32', 'uint256'], [passwordHash, BigInt(minuteBucket)])
  );

  const derivedSigner = new Wallet(minuteSeed);

  const payloadHash = keccak256(
    solidityPacked(
      ['address', 'address', 'uint256', 'uint256', 'bytes32'],
      [keyVaultAddr, authenticatorAddr, BigInt(normalizedChainId), BigInt(minuteBucket), actionHash]
    )
  );

  const signature = await derivedSigner.signMessage(getBytes(payloadHash));
  const authProof = defaultAbiCoder.encode(['bytes'], [signature]);

  log.debug('encodeMinuteSignatureProofPayload', { minuteBucket });

  return {
    authProof,
    minuteBucket,
    derivedAddress: derivedSigner.address
  };
}

/**
 * @param {CreateAuthProofMinuteSignatureWithProviderOptions} [options={}]
 * @returns {Promise<CreateAuthProofMinuteSignatureResult>}
 */
export async function createAuthProofMinuteSignature(options = {}) {
  const { normalizedChainId } = assertMinuteSignatureAuthProofOptions(options);
  log.info('Creating minute signature auth proof');
  return encodeMinuteSignatureProofPayload(options, normalizedChainId, options.actionHash);
}
