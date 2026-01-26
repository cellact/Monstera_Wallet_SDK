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
  createAuthProof
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
            expect(() => hashPassword(null)).toThrow('Password must be a non-empty string');
            expect(() => hashPassword(undefined)).toThrow('Password must be a non-empty string');
            expect(() => hashPassword(123)).toThrow('Password must be a non-empty string');
            expect(() => hashPassword({ password: 'password' })).toThrow('Password must be a non-empty string');
        });
    });

    describe('createAuthProof', () => {
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

            const authProof = await createAuthProof(signer, chainId, authenticatorAddr, deadline, keyVaultAddr);
            expect(authProof).toBeDefined();
            expect(typeof authProof).toBe('string');
            expect(authProof.startsWith('0x')).toBe(true);
        });

        test('should throw an error if the signer is not a Wallet or HDNodeWallet', async () => {
            const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;
            
            await expect(createAuthProof(null, chainId, authenticatorAddr, deadline, keyVaultAddr)).rejects.toThrow('Signer must be a Wallet or HDNodeWallet');
            await expect(createAuthProof(undefined, chainId, authenticatorAddr, deadline, keyVaultAddr)).rejects.toThrow('Signer must be a Wallet or HDNodeWallet');
            await expect(createAuthProof(123, chainId, authenticatorAddr, deadline, keyVaultAddr)).rejects.toThrow('Signer must be a Wallet or HDNodeWallet');
            await expect(createAuthProof({ signer: 'invalid' }, chainId, authenticatorAddr, deadline, keyVaultAddr)).rejects.toThrow('Signer must be a Wallet or HDNodeWallet');
            await expect(createAuthProof(randomAddress(), chainId, authenticatorAddr, deadline, keyVaultAddr)).rejects.toThrow('Signer must be a Wallet or HDNodeWallet');
        });

        test('should throw an error if the chainId is not a string or number', async () => {
            const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;
            
            await expect(createAuthProof(testSigner, null, authenticatorAddr, deadline, keyVaultAddr)).rejects.toThrow('chainId must be a string or number');
            await expect(createAuthProof(testSigner, undefined, authenticatorAddr, deadline, keyVaultAddr)).rejects.toThrow('chainId must be a string or number');
            await expect(createAuthProof(testSigner, { chainId: chainId }, authenticatorAddr, deadline, keyVaultAddr)).rejects.toThrow('chainId must be a string or number');
            await expect(createAuthProof(testSigner, [], authenticatorAddr, deadline, keyVaultAddr)).rejects.toThrow('chainId must be a string or number');
        });

        test('should throw an error if the authenticatorAddr is not a valid address', async () => {
            const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;
            
            await expect(createAuthProof(testSigner, chainId, null, deadline, keyVaultAddr)).rejects.toThrow('authenticatorAddr is required and must be a string');
            await expect(createAuthProof(testSigner, chainId, undefined, deadline, keyVaultAddr)).rejects.toThrow('authenticatorAddr is required and must be a string');
            await expect(createAuthProof(testSigner, chainId, 123, deadline, keyVaultAddr)).rejects.toThrow('authenticatorAddr is required and must be a string');
            await expect(createAuthProof(testSigner, chainId, { address: authenticatorAddr }, deadline, keyVaultAddr)).rejects.toThrow('authenticatorAddr is required and must be a string');
        });

        test('should throw an error if the keyVaultAddr is not a valid address', async () => {
            const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;
            
            await expect(createAuthProof(testSigner, chainId, authenticatorAddr, deadline, null)).rejects.toThrow('keyVaultAddr is required and must be a string');
            await expect(createAuthProof(testSigner, chainId, authenticatorAddr, deadline, undefined)).rejects.toThrow('keyVaultAddr is required and must be a string');
            await expect(createAuthProof(testSigner, chainId, authenticatorAddr, deadline, 123)).rejects.toThrow('keyVaultAddr is required and must be a string');
            await expect(createAuthProof(testSigner, chainId, authenticatorAddr, deadline, { address: keyVaultAddr })).rejects.toThrow('keyVaultAddr is required and must be a string');
        });

        test('should throw an error if the deadline is not a number or is not an integer', async () => {
            const { chainId, authenticatorAddr, deadline, keyVaultAddr } = defaultParams;
            
            await expect(createAuthProof(testSigner, chainId, authenticatorAddr, null, keyVaultAddr)).rejects.toThrow('Deadline must be an integer (Unix timestamp in seconds)');
            await expect(createAuthProof(testSigner, chainId, authenticatorAddr, undefined, keyVaultAddr)).rejects.toThrow('Deadline must be an integer (Unix timestamp in seconds)');
            await expect(createAuthProof(testSigner, chainId, authenticatorAddr, 123.5, keyVaultAddr)).rejects.toThrow('Deadline must be an integer (Unix timestamp in seconds)');
            await expect(createAuthProof(testSigner, chainId, authenticatorAddr, { deadline: deadline }, keyVaultAddr)).rejects.toThrow('Deadline must be an integer (Unix timestamp in seconds)');
        });

        test('should throw an error if the deadline is in the past', async () => {
            const { chainId, authenticatorAddr, keyVaultAddr } = defaultParams;
            const pastDeadline = Math.floor(Date.now() / 1000) - 1000; // 1000 seconds ago
            
            await expect(createAuthProof(testSigner, chainId, authenticatorAddr, pastDeadline, keyVaultAddr)).rejects.toThrow('Deadline must be in the future');
        });
    });
});