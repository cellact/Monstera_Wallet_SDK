/**
 * WalletSignatureAuthenticator auth-proof builder.
 *
 * @module internal/auth/proof/builders/walletSignature
 */

import { defaultAbiCoder } from '../../../../adapters/ethers/encoding.js';
import { assertWalletSignatureAuthProofOptions } from '../../../validators/authProofOptions.js';
import log from '../../../logger.js';
import { signEip712ActionProof } from '../signing/eip712.js';

/**
 * @param {CreateAuthProofWalletSignatureOptions} [options={}]
 * @returns {Promise<EncodedAuthProofWalletSignature>}
 */
export async function createAuthProofWalletSignature(options = {}) {
  const { signer, authenticatorAddr, deadline, keyVaultAddr, actionHash, eip712ContractName } = options;
  const { normalizedChainId } = assertWalletSignatureAuthProofOptions(options);

  log.info('Creating wallet signature auth proof');
  log.debug('createAuthProofWalletSignature', {
    keyVaultAddr,
    authenticatorAddr,
    chainId: normalizedChainId,
    deadline,
    actionHash
  });

  return signEip712ActionProof({
    signer,
    contractName: eip712ContractName ?? 'WalletSignatureAuthenticator',
    structName: 'WalletAuth',
    chainId: normalizedChainId,
    verifyingContract: authenticatorAddr,
    keyVaultAddr,
    actionHash,
    deadline,
    authProofType: 'wallet-signature auth proof',
    functionName: 'createAuthProofWalletSignature',
    encodeOutput: (signature) => defaultAbiCoder.encode(['uint256', 'bytes'], [deadline, signature])
  });
}
