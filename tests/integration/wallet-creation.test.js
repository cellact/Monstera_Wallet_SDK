/**
 * Integration tests for wallet creation functionality
 * 
 * These tests verify that the SDK can create wallets correctly using all available methods.
 * Tests both success and failure scenarios.
 * 
 * Note: These tests require:
 * - Environment variables: SIGNER_PRIVATE_KEY, PASSWORD
 * - Network access and funds for wallet creation
 */

import 'dotenv/config';
import { describe, test, expect, beforeAll } from '@jest/globals';
import { Monstera } from '../../src/index.js';
import { ethers, Mnemonic } from 'ethers';
import { ValidationError, WalletError, WriteRequiresSignerError } from '../../src/errors/index.js';

describe('Wallet Creation Integration Tests', () => {
  let sdk;
  let password;
  let passwordHash;
  let testMnemonic;

  beforeAll(async () => {
    // Get test configuration
    const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY || '';
    password = process.env.PASSWORD || '';
    passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));

    // Generate a test mnemonic for testing createWalletFromMnemonic
    const wallet = ethers.Wallet.createRandom();
    testMnemonic = wallet.mnemonic.phrase;

    sdk = Monstera.connect({
      mainnet: false,
      signer: signerPrivateKey,
      checkVersion: false // Disable version check for tests
    });
  });

  describe('createWallet', () => {
    test('should successfully create a wallet with default authenticator', async () => {
      const result = await sdk.createWallet({
        authConfig: passwordHash
      });

      expect(result).toBeDefined();
      expect(result.wallet).toBeDefined();
      expect(result.keyVault).toBeDefined();
      expect(result.storage).toBeDefined();
      expect(result.authenticator).toBeDefined();
      expect(result.mnemonic).toBeDefined();
      expect(result.transactionHash).toBeDefined();

      // Validate addresses
      expect(result.wallet).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.keyVault).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.storage).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.authenticator).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // Validate mnemonic
      expect(typeof result.mnemonic).toBe('string');
      const words = result.mnemonic.split(' ').filter(w => w.length > 0);
      expect(words.length).toBe(12); // Should be 12-word mnemonic

      // Validate transaction hash
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Verify wallet is recognized by factory
      const isWallet = await sdk.isWallet({ walletAddr: result.wallet });
      expect(isWallet).toBe(true);
    }, 30000); // 30 second timeout for wallet creation

    test('should successfully create a wallet with explicit authenticator', async () => {
      const result = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordAuth,
        authConfig: passwordHash
      });

      expect(result).toBeDefined();
      expect(result.wallet).toBeDefined();
      expect(result.authenticator).toBe(sdk.addresses.passwordAuth);
    }, 30000);

    test('should create wallets with different addresses', async () => {
      const result1 = await sdk.createWallet({
        authConfig: passwordHash
      });

      const result2 = await sdk.createWallet({
        authConfig: passwordHash
      });

      expect(result1.wallet).not.toBe(result2.wallet);
      expect(result1.keyVault).not.toBe(result2.keyVault);
      expect(result1.storage).not.toBe(result2.storage);
      expect(result1.mnemonic).not.toBe(result2.mnemonic);
    }, 60000); // 60 seconds for two wallet creations

    test('should fail with missing authConfig', async () => {
      await expect(
        sdk.createWallet({})
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid authConfig', async () => {
      await expect(
        sdk.createWallet({
          authConfig: 'not-bytes'
        })
      ).rejects.toThrow();
    });

    test('should fail with invalid authenticator address', async () => {
      await expect(
        sdk.createWallet({
          authenticatorAddr: '0x123', // Too short, doesn't match address format
          authConfig: passwordHash
        })
      ).rejects.toThrow(WalletError);
    });

    test('should fail with readonly SDK instance', async () => {
      const readonlySdk = Monstera.readonly({ mainnet: false });

      await expect(
        readonlySdk.createWallet({
          authConfig: passwordHash
        })
      ).rejects.toThrow(WriteRequiresSignerError);
    });
  });

  describe('createWalletFromMnemonic', () => {
    test('should successfully create a wallet from provided mnemonic', async () => {
      const result = await sdk.createWalletFromMnemonic({
        mnemonic: testMnemonic,
        authConfig: passwordHash
      });

      expect(result).toBeDefined();
      expect(result.wallet).toBeDefined();
      expect(result.mnemonic).toBe(testMnemonic); // Should return the provided mnemonic
      expect(result.keyVault).toBeDefined();
      expect(result.storage).toBeDefined();
      expect(result.transactionHash).toBeDefined();

      // Verify wallet is recognized
      const isWallet = await sdk.isWallet({ walletAddr: result.wallet });
      expect(isWallet).toBe(true);
    }, 30000);

    test('should fail with missing mnemonic', async () => {
      await expect(
        sdk.createWalletFromMnemonic({
          authConfig: passwordHash
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid mnemonic', async () => {
      await expect(
        sdk.createWalletFromMnemonic({
          mnemonic: 'invalid mnemonic phrase',
          authConfig: passwordHash
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with mnemonic with wrong word count', async () => {
      await expect(
        sdk.createWalletFromMnemonic({
          mnemonic: 'abandon abandon abandon', // Too few words
          authConfig: passwordHash
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authConfig', async () => {
      await expect(
        sdk.createWalletFromMnemonic({
          mnemonic: testMnemonic
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('createWalletCore', () => {
    test('should successfully create a wallet core', async () => {
      const result = await sdk.createWalletCore({
        authConfig: passwordHash
      });

      expect(result).toBeDefined();
      expect(result.wallet).toBeDefined();
      expect(result.keyVault).toBeDefined();
      expect(result.storage).toBeDefined();
      expect(result.mnemonic).toBeDefined();
      expect(result.transactionHash).toBeDefined();

      // For wallet core, wallet address should equal keyVault address
      expect(result.wallet.toLowerCase()).toBe(result.keyVault.toLowerCase());

      // Verify we can get storage address
      const storageAddr = await sdk.getKeyVaultStorageAddr({
        keyVaultAddr: result.keyVault
      });
      expect(storageAddr.toLowerCase()).toBe(result.storage.toLowerCase());
    }, 30000);

    test('should fail with missing authConfig', async () => {
      await expect(
        sdk.createWalletCore({})
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('createWalletWithHook', () => {
    test('should fail with missing hookAddr', async () => {
      await expect(
        sdk.createWalletWithHook({
          authConfig: passwordHash,
          hookData: ethers.toUtf8Bytes('test')
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing hookData', async () => {
      await expect(
        sdk.createWalletWithHook({
          authConfig: passwordHash,
          hookAddr: '0x0000000000000000000000000000000000000000'
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid hookAddr', async () => {
      await expect(
        sdk.createWalletWithHook({
          authConfig: passwordHash,
          hookAddr: '0x123', // Too short, doesn't match address format
          hookData: ethers.toUtf8Bytes('test')
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authConfig', async () => {
      await expect(
        sdk.createWalletWithHook({
          hookAddr: '0x0000000000000000000000000000000000000000',
          hookData: ethers.toUtf8Bytes('test')
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('createWalletWithCustomLogic', () => {
    test('should fail with missing customLogicImplAddr', async () => {
      await expect(
        sdk.createWalletWithCustomLogic({
          authConfig: passwordHash,
          logicData: ethers.toUtf8Bytes('test')
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing logicData', async () => {
      await expect(
        sdk.createWalletWithCustomLogic({
          authConfig: passwordHash,
          customLogicImplAddr: '0x0000000000000000000000000000000000000000'
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid customLogicImplAddr', async () => {
      await expect(
        sdk.createWalletWithCustomLogic({
          authConfig: passwordHash,
          customLogicImplAddr: '0x123', // Too short, doesn't match address format
          logicData: ethers.toUtf8Bytes('test')
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authConfig', async () => {
      await expect(
        sdk.createWalletWithCustomLogic({
          customLogicImplAddr: '0x0000000000000000000000000000000000000000',
          logicData: ethers.toUtf8Bytes('test')
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Wallet structure validation', () => {
    test('should have correct wallet component relationships', async () => {
      const result = await sdk.createWallet({
        authConfig: passwordHash
      });

      // Verify KeyVault address
      const keyVaultAddr = await sdk.getKeyVaultAddr({
        walletAddr: result.wallet
      });
      expect(keyVaultAddr.toLowerCase()).toBe(result.keyVault.toLowerCase());

      // Verify Storage address
      const storageAddr = await sdk.getStorageAddr({
        walletAddr: result.wallet
      });
      expect(storageAddr.toLowerCase()).toBe(result.storage.toLowerCase());

      // Verify KeyVault storage
      const keyVaultStorage = await sdk.getKeyVaultStorageAddr({
        keyVaultAddr: result.keyVault
      });
      expect(keyVaultStorage.toLowerCase()).toBe(result.storage.toLowerCase());

      // Verify authenticator
      const authenticatorAddr = await sdk.getAuthenticatorAddr({
        keyVaultAddr: result.keyVault
      });
      expect(authenticatorAddr.toLowerCase()).toBe(result.authenticator.toLowerCase());
    }, 30000);

    test('should be initialized after creation', async () => {
      const result = await sdk.createWallet({
        authConfig: passwordHash
      });

      const isInitialized = await sdk.isInitialized({
        keyVaultAddr: result.keyVault
      });
      expect(isInitialized).toBe(true);
    }, 30000);

    test('should generate valid account addresses', async () => {
      const result = await sdk.createWallet({
        authConfig: passwordHash
      });

      // Get multiple account addresses
      const account0 = await sdk.getAccountAddr({
        keyVaultAddr: result.keyVault,
        index: 0
      });
      const account1 = await sdk.getAccountAddr({
        keyVaultAddr: result.keyVault,
        index: 1
      });

      expect(account0).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(account1).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(account0).not.toBe(account1);

      // Get multiple addresses at once
      const addresses = await sdk.getAccountAddresses({
        keyVaultAddr: result.keyVault,
        fromIndex: 0,
        count: 3
      });

      expect(Array.isArray(addresses)).toBe(true);
      expect(addresses.length).toBe(3);
      expect(addresses[0].toLowerCase()).toBe(account0.toLowerCase());
      expect(addresses[1].toLowerCase()).toBe(account1.toLowerCase());
    }, 30000);
  });

  describe('Mnemonic validation', () => {
    test('should generate valid BIP39 mnemonics', async () => {
      const result = await sdk.createWallet({
        authConfig: passwordHash
      });

      // Validate mnemonic format
      const words = result.mnemonic.split(' ').filter(w => w.length > 0);
      expect(words.length).toBe(12);

      // Validate using ethers
      const isValid = Mnemonic.isValidMnemonic(result.mnemonic);
      expect(isValid).toBe(true);
    }, 30000);

    test('should generate unique mnemonics for different wallets', async () => {
      const result1 = await sdk.createWallet({
        authConfig: passwordHash
      });

      const result2 = await sdk.createWallet({
        authConfig: passwordHash
      });

      expect(result1.mnemonic).not.toBe(result2.mnemonic);
    }, 60000); // 60 seconds for two wallet creations
  });

  describe('Error handling', () => {
    test('should handle network errors gracefully', async () => {
      // This test verifies that network errors are properly wrapped
      // We can't easily simulate network errors, but we can test with invalid config
      const invalidSdk = Monstera.connect({
        mainnet: false,
        signer: '0x0000000000000000000000000000000000000000000000000000000000000001',
        rpcUrl: 'https://invalid-rpc-url.example.com',
        checkVersion: false
      });

      // This should fail with a network error or validation error
      await expect(
        invalidSdk.createWallet({
          authConfig: passwordHash
        })
      ).rejects.toThrow();
    });
  });
});
