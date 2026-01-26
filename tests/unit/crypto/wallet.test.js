/**
 * Unit tests for wallet functionality
 */

import { describe, test, expect } from '@jest/globals';
import { expectValidMnemonic } from '../../utils/assertions.js';
import {
  generateMnemonic,
  deriveSeed,
  hashPassword,
  createAuthProof
} from '../../../src/crypto/wallet.js';

// import { ethers, Wallet } from 'ethers';

// const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";
// const RPC_URL = process.env.RPC_URL || "https://testnet.sapphire.oasis.dev";
// const CHAIN_ID = process.env.CHAIN_ID || "0x5aff";
// const AUTHENTICATOR_ADDR = process.env.AUTHENTICATOR_ADDR || "";
// const KEYVAULT_ADDR = process.env.KEYVAULT_ADDR || "";

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

    // TODO: fix this test 
    // describe('createAuthProof', () => {
    //     test('should create an auth proof for a signer and return a string of 65 bytes', () => {
    //         const provider = new ethers.JsonRpcProvider(RPC_URL);
    //         const signer = new Wallet(SIGNER_PRIVATE_KEY, provider);
    //         const nowInSeconds = Math.floor(Date.now() / 1000);
    //         const deadline = nowInSeconds + 3600; // 1 hour from now
    //         const chainId = CHAIN_ID;
    //         const authenticatorAddr = AUTHENTICATOR_ADDR;
    //         const keyVaultAddr = KEYVAULT_ADDR;

    //         const authProof = createAuthProof(signer, chainId, authenticatorAddr, deadline, keyVaultAddr);
    //         expect(authProof).toBeDefined();
    //         expect(typeof authProof).toBe('string');
    //     });

    //     test('should throw an error if the signer is not a Wallet or HDNodeWallet', () => {
    //         expect(() => createAuthProof(null, chainId, authenticatorAddr, deadline, keyVaultAddr)).toThrow('Signer must be a Wallet or HDNodeWallet');
    //         expect(() => createAuthProof(undefined, chainId, authenticatorAddr, deadline, keyVaultAddr)).toThrow('Signer must be a Wallet or HDNodeWallet');
    //         expect(() => createAuthProof(123, chainId, authenticatorAddr, deadline, keyVaultAddr)).toThrow('Signer must be a Wallet or HDNodeWallet');
    //         expect(() => createAuthProof({ signer: signer }, chainId, authenticatorAddr, deadline, keyVaultAddr)).toThrow('Signer must be a Wallet or HDNodeWallet');
    //         expect(() => createAuthProof('0x211A998C67cc62C57407Ffb1173214F81736cAED', chainId, null, deadline, keyVaultAddr)).toThrow('Signer must be a Wallet or HDNodeWallet');
    //     });

    //     test('should throw an error if the chainId is not a string or number, or is empty', () => {
    //         expect(() => createAuthProof(signer, null, '0x1234567890123456789012345678901234567890', deadline, '0x1234567890123456789012345678901234567890')).toThrow('chainId must be a string or number');
    //         expect(() => createAuthProof(signer, undefined, authenticatorAddr, deadline, keyVaultAddr)).toThrow('chainId must be a string or number');
    //         expect(() => createAuthProof(signer, 123, authenticatorAddr, deadline, keyVaultAddr)).toThrow('chainId must be a string or number');
    //         expect(() => createAuthProof(signer, { chainId: chainId }, authenticatorAddr, deadline, keyVaultAddr)).toThrow('chainId must be a string or number');
    //     });

    //     test('should throw an error if the authenticatorAddr is not a valid address', () => {
    //         expect(() => createAuthProof(signer, chainId, null, deadline, keyVaultAddr)).toThrow('authenticatorAddr must be a valid address');
    //         expect(() => createAuthProof(signer, chainId, undefined, deadline, keyVaultAddr)).toThrow('authenticatorAddr must be a valid address');
    //         expect(() => createAuthProof(signer, chainId, 123, deadline, keyVaultAddr)).toThrow('authenticatorAddr must be a valid address');
    //         expect(() => createAuthProof(signer, chainId, { authenticatorAddr: authenticatorAddr }, deadline, keyVaultAddr)).toThrow('authenticatorAddr must be a valid address');
    //     });

    //     test('should throw an error if the keyVaultAddr is not a valid address', () => {
    //         expect(() => createAuthProof(signer, chainId, authenticatorAddr, deadline, null)).toThrow('keyVaultAddr must be a valid address');
    //         expect(() => createAuthProof(signer, chainId, authenticatorAddr, deadline, undefined)).toThrow('keyVaultAddr must be a valid address');
    //         expect(() => createAuthProof(signer, chainId, authenticatorAddr, deadline, 123)).toThrow('keyVaultAddr must be a valid address');
    //         expect(() => createAuthProof(signer, chainId, authenticatorAddr, deadline, { keyVaultAddr: keyVaultAddr })).toThrow('keyVaultAddr must be a valid address');
    //     });

    //     test('should throw an error if the deadline is not a number, or is not an integer', () => {
    //         expect(() => createAuthProof(signer, chainId, authenticatorAddr, null, keyVaultAddr)).toThrow('Deadline must be an integer (Unix timestamp in seconds)');
    //         expect(() => createAuthProof(signer, chainId, authenticatorAddr, undefined, keyVaultAddr)).toThrow('Deadline must be an integer (Unix timestamp in seconds)');
    //         expect(() => createAuthProof(signer, chainId, authenticatorAddr, 123, keyVaultAddr)).toThrow('Deadline must be an integer (Unix timestamp in seconds)');
    //         expect(() => createAuthProof(signer, chainId, authenticatorAddr, { deadline: deadline }, keyVaultAddr)).toThrow('Deadline must be an integer (Unix timestamp in seconds)');
    //     });

    //     test('should throw an error if the deadline is in the past', () => {
    //         expect(() => createAuthProof(signer, chainId, authenticatorAddr, Date.now() - 1000, keyVaultAddr)).toThrow('Deadline must be in the future');
    //     });
    // });
});