/**
 * Unit tests for wallet functionality
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ethers, Wallet } from 'ethers';
import { expectValidMnemonic } from '../../utils/assertions.js';
import {
  TEST_SIGNER,
  DEFAULT_TESTNET_RPC_URL,
  createDefaultAuthProofParams,
  randomAddress
} from '../../utils/fixtures.js';
import { getTestConfig } from '../../utils/setup.js';
import {
  generateMnemonic,
  deriveSeed,
  hashPassword,
  createAuthProofWalletSignature
} from '../../../src/crypto/wallet.js';

describe('Wallet Crypto Utilities', () => {
  describe('generateMnemonic', () => {
    test('should generate a valid mnemonic with 12 words', () => {
      const mnemonic = generateMnemonic();
      expectValidMnemonic(mnemonic, 12);
    });
  });

  describe('deriveSeed', () => {
    test('should derive a seed from a mnemonic and return a buffer of 64 bytes', () => {
      const mnemonic = generateMnemonic();
      const seed = deriveSeed(mnemonic);
      expect(seed).toBeDefined();
      expect(seed instanceof Uint8Array).toBe(true);
      expect(seed.length).toBe(64);
    });
  });

  describe('hashPassword', () => {
    test('should hash a password and return a string', () => {
      const password = 'password';
      const hashedPassword = hashPassword(password);
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });

    test('should throw an error if the password is not a string or is empty', () => {
      expect(() => hashPassword(null)).toThrow('password is required and must be a string');
      expect(() => hashPassword(undefined)).toThrow('password is required and must be a string');
      expect(() => hashPassword(123)).toThrow('password is required and must be a string');
      expect(() => hashPassword({ password: 'password' })).toThrow('password is required and must be a string');
    });
  });

  describe('createAuthProofWalletSignature', () => {
    let defaultParams;
    let testSigner;

    beforeEach(() => {
      defaultParams = createDefaultAuthProofParams();
      testSigner = new Wallet(TEST_SIGNER);
    });

    test('should create an auth proof for a signer and return a string', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      const config = getTestConfig();

      const provider = new ethers.JsonRpcProvider(DEFAULT_TESTNET_RPC_URL);
      const signer = new Wallet(config.signerPrivateKey, provider);

      const authProof = await createAuthProofWalletSignature({
        signer,
        chainId,
        authenticatorAddr,
        deadline,
        keyVaultAddr
      });
      expect(authProof).toBeDefined();
      expect(typeof authProof).toBe('string');
      expect(authProof.startsWith('0x')).toBe(true);
    });

    test('should throw an error if the signer is not a Wallet or HDNodeWallet', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: null,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('Signer must be a Wallet or HDNodeWallet');
      await expect(
        createAuthProofWalletSignature({
          signer: undefined,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('Signer must be a Wallet or HDNodeWallet');
      await expect(
        createAuthProofWalletSignature({
          signer: /** @type {any} */ (123),
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('Signer must be a Wallet or HDNodeWallet');
      await expect(
        createAuthProofWalletSignature({
          signer: /** @type {any} */ ('invalid'),
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('Signer must be a Wallet or HDNodeWallet');
      await expect(
        createAuthProofWalletSignature({
          signer: /** @type {any} */ (randomAddress()),
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('Signer must be a Wallet or HDNodeWallet');
    });

    test('should throw an error if the chainId is not a string or number', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId: null,
          authenticatorAddr,
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('chainId must be a string or number');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId: undefined,
          authenticatorAddr,
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('chainId must be a string or number');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId: /** @type {any} */ ({ chainId }),
          authenticatorAddr,
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('chainId must be a string or number');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId: /** @type {any} */ ([]),
          authenticatorAddr,
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('chainId must be a string or number');
    });

    test('should throw an error if the authenticatorAddr is not a valid address', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr: null,
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr: undefined,
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr: /** @type {any} */ (123),
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr: /** @type {any} */ ({ address: authenticatorAddr }),
          deadline,
          keyVaultAddr
        })
      ).rejects.toThrow('authenticatorAddr is required and must be a string');
    });

    test('should throw an error if the keyVaultAddr is not a valid address', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr: null
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr: undefined
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr: /** @type {any} */ (123)
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a string');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline,
          keyVaultAddr: /** @type {any} */ ({ address: keyVaultAddr })
        })
      ).rejects.toThrow('keyVaultAddr is required and must be a string');
    });

    test('should throw an error if the deadline is not a number or is not an integer', async () => {
      const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline: null,
          keyVaultAddr
        })
      ).rejects.toThrow('Deadline must be an integer (Unix timestamp in seconds)');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline: undefined,
          keyVaultAddr
        })
      ).rejects.toThrow('Deadline must be an integer (Unix timestamp in seconds)');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline: 123.5,
          keyVaultAddr
        })
      ).rejects.toThrow('Deadline must be an integer (Unix timestamp in seconds)');
      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline: /** @type {any} */ ({ deadline }),
          keyVaultAddr
        })
      ).rejects.toThrow('Deadline must be an integer (Unix timestamp in seconds)');
    });

    test('should throw an error if the deadline is in the past', async () => {
      const { chainId, authenticatorAddr, keyVaultAddr } = defaultParams;
      const pastDeadline = Math.floor(Date.now() / 1000) - 1000;

      await expect(
        createAuthProofWalletSignature({
          signer: testSigner,
          chainId,
          authenticatorAddr,
          deadline: pastDeadline,
          keyVaultAddr
        })
      ).rejects.toThrow('Deadline must be in the future');
    });
  });
});
