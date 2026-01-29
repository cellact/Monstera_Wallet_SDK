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
import { ethers } from 'ethers';
import { 
  createTestSDK, 
  getTestConfig, 
  setupTestWallet 
} from '../utils/setup.js';
import { 
  createPasswordAuthProof,
  INVALID_ADDRESS,
  ZERO_ADDRESS
} from '../utils/fixtures.js';
import { 
  expectValidHex,
  expectValidAddress
} from '../utils/assertions.js';
import { 
  testMissingParam, 
  testInvalidAddress 
} from '../utils/validation-helpers.js';

describe('Signing Integration Tests', () => {
  let sdk;
  let walletAddr;
  let keyVaultAddr;
  let password;
  let authProof;
  let accountIndex;

  beforeAll(async () => {
    const config = getTestConfig();
    password = config.password;
    const passwordHash = config.passwordHash;
    accountIndex = 0;

    sdk = createTestSDK();

    // Setup test wallet (uses existing from env or creates new)
    const walletData = await setupTestWallet(sdk, passwordHash);
    walletAddr = walletData.wallet;
    keyVaultAddr = walletData.keyVault;

    // Prepare auth proof
    authProof = createPasswordAuthProof(password);
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
      expectValidHex(signature);

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
      const wrongAuthProof = createPasswordAuthProof('wrongpassword');
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

      await testMissingParam(
        sdk.signMessage.bind(sdk),
        {
          authProof,
          index: accountIndex,
          message: messageBytes
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing authProof', async () => {
      const messageBytes = ethers.toUtf8Bytes('test');

      await testMissingParam(
        sdk.signMessage.bind(sdk),
        {
          keyVaultAddr,
          index: accountIndex,
          message: messageBytes
        },
        'authProof'
      );
    });

    test('should fail with missing index', async () => {
      const messageBytes = ethers.toUtf8Bytes('test');

      await testMissingParam(
        sdk.signMessage.bind(sdk),
        {
          keyVaultAddr,
          authProof,
          message: messageBytes
        },
        'index'
      );
    });

    test('should fail with missing message', async () => {
      await testMissingParam(
        sdk.signMessage.bind(sdk),
        {
          keyVaultAddr,
          authProof,
          index: accountIndex
        },
        'message'
      );
    });

    test('should fail with invalid keyVaultAddr', async () => {
      const messageBytes = ethers.toUtf8Bytes('test');

      await testInvalidAddress(
        sdk.signMessage.bind(sdk),
        {
          keyVaultAddr,
          authProof,
          index: accountIndex,
          message: messageBytes
        },
        'keyVaultAddr'
      );
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
      ).rejects.toThrow();
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
      expectValidHex(signature);

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
      const wrongAuthProof = createPasswordAuthProof('wrongpassword');
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
      await testMissingParam(
        sdk.sign.bind(sdk),
        {
          keyVaultAddr,
          authProof,
          index: accountIndex
        },
        'hash'
      );
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
      const to = ZERO_ADDRESS;
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
      expectValidHex(signedTx);
      const tx = ethers.Transaction.from(signedTx);
      expect(tx.data).toBeDefined();
    });

    test('should fail with wrong password', async () => {
      const wrongAuthProof = createPasswordAuthProof('wrongpassword');
      const to = ZERO_ADDRESS;
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

    // Helper to create base transaction params
    const createBaseTxParams = () => ({
      index: accountIndex,
      nonce: 0,
      gasPrice: ethers.parseUnits('30', 'gwei'),
      gasLimit: 21000n,
      to: ZERO_ADDRESS,
      value: 0n,
      txData: '0x',
      chainId: sdk.chainId
    });

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.signTransaction.bind(sdk),
        {
          authProof,
          ...createBaseTxParams()
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing authProof', async () => {
      await testMissingParam(
        sdk.signTransaction.bind(sdk),
        {
          keyVaultAddr,
          ...createBaseTxParams()
        },
        'authProof'
      );
    });

    test('should fail with missing required transaction fields', async () => {
      const baseParams = createBaseTxParams();
      
      // Missing nonce
      await testMissingParam(
        sdk.signTransaction.bind(sdk),
        {
          keyVaultAddr,
          authProof,
          ...baseParams
        },
        'nonce'
      );

      // Missing to
      await testMissingParam(
        sdk.signTransaction.bind(sdk),
        {
          keyVaultAddr,
          authProof,
          ...baseParams
        },
        'to'
      );
    });

    test('should fail with invalid address', async () => {
      await testInvalidAddress(
        sdk.signTransaction.bind(sdk),
        {
          keyVaultAddr,
          authProof,
          ...createBaseTxParams()
        },
        'to'
      );
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
          to: ZERO_ADDRESS,
          value: 0n,
          txData: '0x',
          chainId: sdk.chainId
        })
      ).rejects.toThrow();
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
      expectValidAddress(addr0);
      expectValidAddress(addr1);
      expect(addr0).not.toBe(addr1);

      const recovered0 = ethers.verifyMessage('test message', sig0);
      const recovered1 = ethers.verifyMessage('test message', sig1);
      expect(recovered0.toLowerCase()).toBe(addr0.toLowerCase());
      expect(recovered1.toLowerCase()).toBe(addr1.toLowerCase());
        });
    });
});