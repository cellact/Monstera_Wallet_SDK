/**
 * Off-chain auth proof bytes for built-in KeyVault authenticators (EIP-712, minute bucket, dual factor).
 *
 * @typedef {import('../../types/index.js').CreateAuthProofWalletSignatureOptions} CreateAuthProofWalletSignatureOptions
 * @typedef {import('../../types/index.js').CreateAuthProofMinuteSignatureWithProviderOptions} CreateAuthProofMinuteSignatureWithProviderOptions
 * @typedef {import('../../types/index.js').CreateAuthProofDualFactorWithProviderOptions} CreateAuthProofDualFactorWithProviderOptions
 * @typedef {import('../../types/index.js').EncodedAuthProofWalletSignature} EncodedAuthProofWalletSignature
 * @typedef {import('../../types/index.js').CreateAuthProofMinuteSignatureResult} CreateAuthProofMinuteSignatureResult
 * @typedef {import('../../types/index.js').EncodedAuthProofDualFactor} EncodedAuthProofDualFactor
 * @typedef {import('../../types/index.js').ValidationError} ValidationError
 */

import { ethers, Wallet } from 'ethers';
import {
  requireAddress,
  requireBytes32,
  requireWalletOrHdNode,
  requireChainId,
  requirePositiveInteger,
  isInFuture
} from '../assert.js';
import { floorTimestampToMinuteBucket } from '../utils/time.js';
import { NetworkError, ValidationError } from '../../errors/index.js';
import log from '../logger.js';
import { rethrowMappedSignerError } from './signingErrorMapper.js';

/**
 * Create auth proof (EIP-712 authentication proof)
 *
 * @param {CreateAuthProofWalletSignatureOptions} options
 * @returns {Promise<EncodedAuthProofWalletSignature>} encoded auth proof
 * @throws {ValidationError} If signer is not a Wallet or HDNodeWallet, chainId is not a valid chain id, authenticatorAddr is not a valid address, keyVaultAddr is not a valid address, deadline is not a number or is not an integer (Unix timestamp in seconds), or deadline is in the past
 */
async function createAuthProofWalletSignature(options = {}) {
  const { signer, chainId, authenticatorAddr, deadline, keyVaultAddr } = options;

  requireWalletOrHdNode(signer, 'signer');
  const normalizedChainId = requireChainId(chainId, 'chainId');
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requirePositiveInteger(deadline, 'deadline');
  isInFuture(deadline, 'deadline');

  log.info('Creating auth proof');
  log.debug('createAuthProofWalletSignature', { keyVaultAddr, authenticatorAddr, chainId: normalizedChainId, deadline });

  // build EIP-712 domain
  const domain = {
    name: 'WalletSignatureAuthenticator',
    version: '1',
    chainId: normalizedChainId,
    verifyingContract: authenticatorAddr
  };
  const types = {
    WalletAuth: [
      { name: 'wallet', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ]
  };

  const value = { wallet: keyVaultAddr, deadline };

  try {
    const signature = await signer.signTypedData(domain, types, value);
    return ethers.AbiCoder.defaultAbiCoder().encode(['uint256', 'bytes'], [deadline, signature]);
  } catch (error) {
    rethrowMappedSignerError(error, {
      authProofType: 'wallet-signature auth proof',
      functionName: 'createAuthProofWalletSignature',
      validationExtra: { deadline }
    });
  }
}

/**
 * Build {@code authProof} for PasswordMinuteSignatureAuthenticator: {@code abi.encode(bytes signature)}
 * over the EIP-191 digest of the same {@code payloadHash} the contract uses.
 *
 * @param {CreateAuthProofMinuteSignatureWithProviderOptions} options
 * @returns {Promise<CreateAuthProofMinuteSignatureResult>} encoded auth proof
 * @throws {ValidationError} If provider is not a valid provider, keyVaultAddr is not a valid address, authenticatorAddr is not a valid address, chainId is not a valid chain id, or passwordHash is not a valid 32-byte hex string
 */
async function createAuthProofMinuteSignature(options = {}) {
  const { provider, keyVaultAddr, authenticatorAddr, chainId, passwordHash } = options;

  if (!provider || typeof provider.getBlock !== 'function') {
    throw new ValidationError('provider must expose getBlock', 'provider', provider);
  }
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  const normalizedChainId = requireChainId(chainId, 'chainId');
  requireBytes32(passwordHash, 'passwordHash');

  const block = await provider.getBlock('latest');
  if (!block) {
    throw new NetworkError('Failed to read latest block from provider', null, null);
  }
  const minuteBucket = floorTimestampToMinuteBucket(block.timestamp);

  const minuteSeed = ethers.keccak256(
    ethers.solidityPacked(['bytes32', 'uint256'], [passwordHash, BigInt(minuteBucket)])
  );

  const derivedSigner = new Wallet(minuteSeed);

  const payloadHash = ethers.keccak256(
    ethers.solidityPacked(
      ['address', 'address', 'uint256', 'uint256'],
      [keyVaultAddr, authenticatorAddr, BigInt(normalizedChainId), BigInt(minuteBucket)]
    )
  );

  const signature = await derivedSigner.signMessage(ethers.getBytes(payloadHash));
  const authProof = ethers.AbiCoder.defaultAbiCoder().encode(['bytes'], [signature]);

  log.debug('createAuthProofMinuteSignature', { minuteBucket });

  return {
    authProof,
    minuteBucket,
    derivedAddress: derivedSigner.address
  };
}

/**
 * Build {@code authProof} for DualFactorAuthenticator:
 * {@code abi.encode(bytes minutePasswordSignature, uint256 deadline, bytes guardianSignature)}.
 *
 * @param {CreateAuthProofDualFactorWithProviderOptions} options
 * @returns {Promise<EncodedAuthProofDualFactor>} encoded auth proof
 * @throws {ValidationError} If provider is not a valid provider, keyVaultAddr is not a valid address, passwordHash is not a valid 32-byte hex string, signer is not a Wallet or HDNodeWallet, authenticatorAddr is not a valid address, chainId is not a valid chain id, deadline is not a number or is not an integer (Unix timestamp in seconds), or deadline is in the past
 */
async function createAuthProofDualFactor(options = {}) {
  const { provider, keyVaultAddr, passwordHash, signer, authenticatorAddr, deadline, chainId } = options;

  requireBytes32(passwordHash, 'passwordHash');
  requireWalletOrHdNode(signer, 'signer');
  requirePositiveInteger(deadline, 'deadline');
  isInFuture(deadline, 'deadline');
  const normalizedChainId = requireChainId(chainId, 'chainId');

  log.info('Creating dual-factor auth proof');
  log.debug('createAuthProofDualFactor', { keyVaultAddr, authenticatorAddr, chainId: normalizedChainId, deadline });

  const minuteProof = await createAuthProofMinuteSignature({
    provider,
    keyVaultAddr,
    authenticatorAddr,
    chainId: normalizedChainId,
    passwordHash
  });

  const [minutePasswordSignature] = ethers.AbiCoder.defaultAbiCoder().decode(['bytes'], minuteProof.authProof);

  const domain = {
    name: 'DualFactorAuthenticator',
    version: '1',
    chainId: normalizedChainId,
    verifyingContract: authenticatorAddr
  };
  const types = {
    DualFactorAuth: [
      { name: 'wallet', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ]
  };
  const value = { wallet: keyVaultAddr, deadline };

  try {
    const guardianSignature = await signer.signTypedData(domain, types, value);
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes', 'uint256', 'bytes'],
      [minutePasswordSignature, deadline, guardianSignature]
    );
  } catch (error) {
    rethrowMappedSignerError(error, {
      authProofType: 'dual-factor auth proof',
      functionName: 'createAuthProofDualFactor',
      validationExtra: { deadline }
    });
  }
}

export { createAuthProofWalletSignature, createAuthProofMinuteSignature, createAuthProofDualFactor };
