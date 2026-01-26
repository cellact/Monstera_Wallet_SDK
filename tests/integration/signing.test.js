/**
 * Integration tests for signing functionality
 * 
 * These tests verify that the SDK can sign transactions, messages, and hashes correctly.
 * Tests both success and failure scenarios.
 * 
 * Note: These tests require either:
 * - Environment variables: SIGNER_PRIVATE_KEY, WALLET_ADDRESS, PASSWORD
 * - Or will create a new wallet (requires network access and funds)
 */
import 'dotenv/config';
import { describe, test, expect, beforeAll } from '@jest/globals';
import { Monstera } from '../../src/index.js';
import { ethers } from 'ethers';
import { ValidationError } from '../../src/errors/index.js';

describe('Signing Integration Tests', () => {
  let sdk;
  let keyVaultAddr;
  let walletAddr;
  let password;
  let authProof;
  let accountIndex;

  beforeAll(async () => {
    // Get or create test wallet
    const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY || '';
    password = process.env.PASSWORD || '';
    walletAddr = process.env.WALLET_ADDRESS || '';
    accountIndex = 0;

    sdk = Monstera.connect({
      mainnet: false,
      signer: signerPrivateKey,
      checkVersion: false // Disable version check for tests
    });

    // If wallet address is provided, use it; otherwise create a new wallet
    if (walletAddr) {
      keyVaultAddr = await sdk.getKeyVaultAddr({ walletAddr });
    } else {
      // Create a new wallet for testing
      const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));
      const result = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordAuth,
        authConfig: passwordHash
      });
      walletAddr = result.wallet;
      keyVaultAddr = result.keyVault;
    }

    // Prepare auth proof
    authProof = ethers.toUtf8Bytes(password);
  });

  describe('signMessage', () => {
    test('should successfully sign a message', async () => {
      const message = 'Hello, Monstera!';
      const messageBytes = ethers.toUtf8Bytes(message);

      const signature = await sdk.signMessage({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        message: messageBytes
      });

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);

      // Verify the signature
      const accountAddr = await sdk.getAccountAddr({
        keyVaultAddr,
        index: accountIndex
      });
      const recovered = ethers.verifyMessage(message, signature);
      expect(recovered.toLowerCase()).toBe(accountAddr.toLowerCase());
    });

    test('should sign empty message', async () => {
      const messageBytes = ethers.toUtf8Bytes('');

      const signature = await sdk.signMessage({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        message: messageBytes
      });

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    test('should fail with wrong password', async () => {
      const wrongAuthProof = ethers.toUtf8Bytes('wrongpassword');
      const messageBytes = ethers.toUtf8Bytes('test message');

      await expect(
        sdk.signMessage({
          keyVaultAddr,
          authProof: wrongAuthProof,
          index: accountIndex,
          message: messageBytes
        })
      ).rejects.toThrow();
    });

    test('should fail with missing keyVaultAddr', async () => {
      const messageBytes = ethers.toUtf8Bytes('test');

      await expect(
        sdk.signMessage({
          authProof,
          index: accountIndex,
          message: messageBytes
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authProof', async () => {
      const messageBytes = ethers.toUtf8Bytes('test');

      await expect(
        sdk.signMessage({
          keyVaultAddr,
          index: accountIndex,
          message: messageBytes
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing index', async () => {
      const messageBytes = ethers.toUtf8Bytes('test');

      await expect(
        sdk.signMessage({
          keyVaultAddr,
          authProof,
          message: messageBytes
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing message', async () => {
      await expect(
        sdk.signMessage({
          keyVaultAddr,
          authProof,
          index: accountIndex
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid keyVaultAddr', async () => {
      const messageBytes = ethers.toUtf8Bytes('test');

      await expect(
        sdk.signMessage({
          keyVaultAddr: '0xinvalid',
          authProof,
          index: accountIndex,
          message: messageBytes
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with negative index', async () => {
      const messageBytes = ethers.toUtf8Bytes('test');

      await expect(
        sdk.signMessage({
          keyVaultAddr,
          authProof,
          index: -1,
          message: messageBytes
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('sign (hash signing)', () => {
    test('should successfully sign a hash', async () => {
      const data = 'Some data to hash';
      const hash = ethers.keccak256(ethers.toUtf8Bytes(data));

      const signature = await sdk.sign({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        hash
      });

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);

      // Verify the signature
      const accountAddr = await sdk.getAccountAddr({
        keyVaultAddr,
        index: accountIndex
      });
      const recovered = ethers.recoverAddress(hash, signature);
      expect(recovered.toLowerCase()).toBe(accountAddr.toLowerCase());
    });

    test('should sign different hashes with different signatures', async () => {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes('data1'));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes('data2'));

      const sig1 = await sdk.sign({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        hash: hash1
      });

      const sig2 = await sdk.sign({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        hash: hash2
      });

      expect(sig1).not.toBe(sig2);
    });

    test('should fail with wrong password', async () => {
      const wrongAuthProof = ethers.toUtf8Bytes('wrongpassword');
      const hash = ethers.keccak256(ethers.toUtf8Bytes('test'));

      await expect(
        sdk.sign({
          keyVaultAddr,
          authProof: wrongAuthProof,
          index: accountIndex,
          hash
        })
      ).rejects.toThrow();
    });

    test('should fail with missing hash', async () => {
      await expect(
        sdk.sign({
          keyVaultAddr,
          authProof,
          index: accountIndex
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid hash length', async () => {
      const invalidHash = '0x1234'; // Too short

      await expect(
        sdk.sign({
          keyVaultAddr,
          authProof,
          index: accountIndex,
          hash: invalidHash
        })
      ).rejects.toThrow();
    });
  });

  describe('signTransaction', () => {
    // TODO: fix this test
    // test('should successfully sign a transaction', async () => {
    //   const to = '0x0000000000000000000000000000000000000000';
    //   const value = ethers.parseEther('0.001');
    //   const nonce = 0;
    //   const gasPrice = ethers.parseUnits('30', 'gwei');
    //   const gasLimit = 21000n;
    //   const txData = '0x';
    //   const chainId = sdk.chainId;

    //   const signedTx = await sdk.signTransaction({
    //     keyVaultAddr,
    //     authProof,
    //     index: accountIndex,
    //     nonce,
    //     gasPrice,
    //     gasLimit,
    //     to,
    //     value,
    //     txData,
    //     chainId
    //   });

    //   expect(signedTx).toBeDefined();
    //   expect(typeof signedTx).toBe('string');
    //   expect(signedTx).toMatch(/^0x[a-fA-F0-9]+$/);

    //   // Parse and verify the transaction
    //   const tx = ethers.Transaction.from(signedTx);
    //   expect(tx.to?.toLowerCase()).toBe(to.toLowerCase());
    //   expect(tx.value).toBe(value);
    //   expect(tx.nonce).toBe(nonce);
    // });

    test('should sign transaction with data', async () => {
      const to = '0x0000000000000000000000000000000000000000';
      const value = 0n;
      const nonce = 0;
      const gasPrice = ethers.parseUnits('30', 'gwei');
      const gasLimit = 100000n;
      const txData = ethers.toUtf8Bytes('test data');
      const chainId = sdk.chainId;

      const signedTx = await sdk.signTransaction({
        keyVaultAddr,
        authProof,
        index: accountIndex,
        nonce,
        gasPrice,
        gasLimit,
        to,
        value,
        txData,
        chainId
      });

      expect(signedTx).toBeDefined();
      const tx = ethers.Transaction.from(signedTx);
      expect(tx.data).toBeDefined();
    });

    test('should fail with wrong password', async () => {
      const wrongAuthProof = ethers.toUtf8Bytes('wrongpassword');
      const to = '0x0000000000000000000000000000000000000000';
      const value = ethers.parseEther('0.001');
      const nonce = 0;
      const gasPrice = ethers.parseUnits('30', 'gwei');
      const gasLimit = 21000n;
      const txData = '0x';
      const chainId = sdk.chainId;

      await expect(
        sdk.signTransaction({
          keyVaultAddr,
          authProof: wrongAuthProof,
          index: accountIndex,
          nonce,
          gasPrice,
          gasLimit,
          to,
          value,
          txData,
          chainId
        })
      ).rejects.toThrow();
    });

    test('should fail with missing keyVaultAddr', async () => {
      await expect(
        sdk.signTransaction({
          authProof,
          index: accountIndex,
          nonce: 0,
          gasPrice: ethers.parseUnits('30', 'gwei'),
          gasLimit: 21000n,
          to: '0x0000000000000000000000000000000000000000',
          value: 0n,
          txData: '0x',
          chainId: sdk.chainId
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authProof', async () => {
      await expect(
        sdk.signTransaction({
          keyVaultAddr,
          index: accountIndex,
          nonce: 0,
          gasPrice: ethers.parseUnits('30', 'gwei'),
          gasLimit: 21000n,
          to: '0x0000000000000000000000000000000000000000',
          value: 0n,
          txData: '0x',
          chainId: sdk.chainId
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing required transaction fields', async () => {
      // Missing nonce
      await expect(
        sdk.signTransaction({
          keyVaultAddr,
          authProof,
          index: accountIndex,
          gasPrice: ethers.parseUnits('30', 'gwei'),
          gasLimit: 21000n,
          to: '0x0000000000000000000000000000000000000000',
          value: 0n,
          txData: '0x',
          chainId: sdk.chainId
        })
      ).rejects.toThrow(ValidationError);

      // Missing to
      await expect(
        sdk.signTransaction({
          keyVaultAddr,
          authProof,
          index: accountIndex,
          nonce: 0,
          gasPrice: ethers.parseUnits('30', 'gwei'),
          gasLimit: 21000n,
          value: 0n,
          txData: '0x',
          chainId: sdk.chainId
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid address', async () => {
      await expect(
        sdk.signTransaction({
          keyVaultAddr,
          authProof,
          index: accountIndex,
          nonce: 0,
          gasPrice: ethers.parseUnits('30', 'gwei'),
          gasLimit: 21000n,
          to: '0xinvalid',
          value: 0n,
          txData: '0x',
          chainId: sdk.chainId
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with negative values', async () => {
      await expect(
        sdk.signTransaction({
          keyVaultAddr,
          authProof,
          index: accountIndex,
          nonce: -1,
          gasPrice: ethers.parseUnits('30', 'gwei'),
          gasLimit: 21000n,
            to: '0x0000000000000000000000000000000000000000',
          value: 0n,
          txData: '0x',
          chainId: sdk.chainId
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Cross-account signing', () => {
    test('should sign with different account indices', async () => {
      const messageBytes = ethers.toUtf8Bytes('test message');

      // Sign with account 0
      const sig0 = await sdk.signMessage({
        keyVaultAddr,
        authProof,
        index: 0,
        message: messageBytes
      });

      // Sign with account 1
      const sig1 = await sdk.signMessage({
        keyVaultAddr,
        authProof,
        index: 1,
        message: messageBytes
      });

      expect(sig0).toBeDefined();
      expect(sig1).toBeDefined();
      expect(sig0).not.toBe(sig1); // Different accounts should produce different signatures

      // Verify both signatures
      const addr0 = await sdk.getAccountAddr({ keyVaultAddr, index: 0 });
      const addr1 = await sdk.getAccountAddr({ keyVaultAddr, index: 1 });
      expect(addr0).not.toBe(addr1);

      const recovered0 = ethers.verifyMessage('test message', sig0);
      const recovered1 = ethers.verifyMessage('test message', sig1);
      expect(recovered0.toLowerCase()).toBe(addr0.toLowerCase());
      expect(recovered1.toLowerCase()).toBe(addr1.toLowerCase());
        });
    });
});