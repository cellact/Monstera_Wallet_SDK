/**
 * DualFactorAuthenticator auth-proof builder.
 *
 * @module internal/auth/proof/builders/dualFactor
 */

import { defaultAbiCoder } from '../../../../adapters/ethers/encoding.js';
import { assertDualFactorAuthProofOptions } from '../../../validators/authProofOptions.js';
import log from '../../../logger.js';
import { signEip712ActionProof } from '../signing/eip712.js';
import { encodeMinuteSignatureProofPayload } from './minuteSignature.js';

/**
 * @param {CreateAuthProofDualFactorWithProviderOptions} [options={}]
 * @returns {Promise<EncodedAuthProofDualFactor>}
 */
export async function createAuthProofDualFactor(options = {}) {
  const { signer, keyVaultAddr, authenticatorAddr, deadline, actionHash } = options;

  const { normalizedChainId } = assertDualFactorAuthProofOptions(options);

  log.info('Creating dual-factor auth proof');
  log.debug('createAuthProofDualFactor', {
    keyVaultAddr,
    authenticatorAddr,
    chainId: normalizedChainId,
    deadline,
    actionHash
  });

  const minuteProof = await encodeMinuteSignatureProofPayload(
    options,
    normalizedChainId,
    actionHash
  );

  const [minutePasswordSignature] = defaultAbiCoder.decode(['bytes'], minuteProof.authProof);

  return signEip712ActionProof({
    signer,
    contractName: 'DualFactorAuthenticator',
    structName: 'DualFactorAuth',
    chainId: normalizedChainId,
    verifyingContract: authenticatorAddr,
    keyVaultAddr,
    actionHash,
    deadline,
    authProofType: 'dual-factor auth proof',
    functionName: 'createAuthProofDualFactor',
    encodeOutput: (guardianSignature) =>
      defaultAbiCoder.encode(
        ['bytes', 'uint256', 'bytes'],
        [minutePasswordSignature, deadline, guardianSignature]
      )
  });
}
