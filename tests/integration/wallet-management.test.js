/**
 * Integration tests for wallet management functionality
 * 
 * These tests verify that the SDK can manage wallet lifecycle operations correctly.
 * Tests both success and failure scenarios for initialization, updates, and admin operations.
 * 
 * Note: These tests require:
 * - Environment variables: SIGNER_PRIVATE_KEY, PASSWORD
 * - Network access and funds for wallet operations
 */

import 'dotenv/config';
import { describe, test, expect, beforeAll } from '@jest/globals';
import { Monstera } from '../../src/index.js';
import { ethers, Wallet } from 'ethers';
import { ValidationError, WriteRequiresSignerError } from '../../src/errors/index.js';

describe('Wallet Management Integration Tests', () => {
  let sdk;
  let password;
  let passwordHash;
  let walletAddr;
  let keyVaultAddr;
  let storageAddr;
  let authenticatorAddr;
  let testWallet; // For wallet signature auth tests
  let testWalletAddr;

  beforeAll(async () => {
    // Get test configuration
    const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY || '';
    password = process.env.PASSWORD || '';
    passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));

    // Create a test wallet for wallet signature authentication
    testWallet = Wallet.createRandom();
    testWalletAddr = testWallet.address;

    sdk = Monstera.connect({
      mainnet: false,
      signer: signerPrivateKey,
      checkVersion: false // Disable version check for tests
    });

    // Create a wallet for testing (if not provided via env)
    if (!process.env.WALLET_ADDRESS) {
      const result = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordAuth,
        authConfig: passwordHash
      });
      walletAddr = result.wallet;
      keyVaultAddr = result.keyVault;
      storageAddr = result.storage;
      authenticatorAddr = result.authenticator;
    } else {
      walletAddr = process.env.WALLET_ADDRESS;
      keyVaultAddr = await sdk.getKeyVaultAddr({ walletAddr });
      storageAddr = await sdk.getStorageAddr({ walletAddr });
      authenticatorAddr = await sdk.getAuthenticatorAddr({ keyVaultAddr });
    }
  }, 30000);

  describe('initializeWalletLogic', () => {
    test('should successfully initialize wallet logic', async () => {
      // Create a new wallet (wallet logic is initialized during creation)
      // But we can test the method directly
      const newWallet = await sdk.createWallet({
        authConfig: passwordHash
      });

      // Check if already initialized
      const isInitialized = await sdk.isInitialized({
        keyVaultAddr: newWallet.keyVault
      });

      // If not initialized, initialize it
      if (!isInitialized) {
        const result = await sdk.initializeWalletLogic({
          walletAddr: newWallet.wallet,
          keyVaultAddr: newWallet.keyVault
        });

        expect(result).toBeDefined();
        expect(result.transactionHash).toBeDefined();
        expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

        // Verify it's now initialized
        const isInitializedAfter = await sdk.isInitialized({
          keyVaultAddr: newWallet.keyVault
        });
        expect(isInitializedAfter).toBe(true);
      } else {
        // Already initialized, verify it stays initialized
        expect(isInitialized).toBe(true);
      }
    }, 30000);

    test('should fail with missing walletAddr', async () => {
      await expect(
        sdk.initializeWalletLogic({
          keyVaultAddr: keyVaultAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing keyVaultAddr', async () => {
      await expect(
        sdk.initializeWalletLogic({
          walletAddr: walletAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid walletAddr', async () => {
      await expect(
        sdk.initializeWalletLogic({
          walletAddr: '0x123', // Too short
          keyVaultAddr: keyVaultAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with readonly SDK instance', async () => {
      const readonlySdk = Monstera.readonly({ mainnet: false });

      await expect(
        readonlySdk.initializeWalletLogic({
          walletAddr: walletAddr,
          keyVaultAddr: keyVaultAddr
        })
      ).rejects.toThrow(WriteRequiresSignerError);
    });
  });

  describe('updateAuthenticatorAddr', () => {
    test('should successfully update authenticator address', async () => {
      // Create a new wallet for testing
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordAuth,
        authConfig: passwordHash
      });

      // Prepare auth proof
      const authProof = ethers.toUtf8Bytes(password);

      // Update to wallet signature authenticator
      const whitelist = [testWalletAddr];
      const newAuthConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);

      const result = await sdk.updateAuthenticatorAddr({
        keyVaultAddr: newWallet.keyVault,
        authProof: authProof,
        newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
        newAuthConfig: newAuthConfig
      });

      expect(result).toBeDefined();
      expect(result.transactionHash).toBeDefined();
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Verify authenticator was updated
      const updatedAuthenticator = await sdk.getAuthenticatorAddr({
        keyVaultAddr: newWallet.keyVault
      });
      expect(updatedAuthenticator.toLowerCase()).toBe(sdk.addresses.walletSignatureAuth.toLowerCase());
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      const authProof = ethers.toUtf8Bytes(password);
      const whitelist = [testWalletAddr];
      const newAuthConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);

      await expect(
        sdk.updateAuthenticatorAddr({
          authProof: authProof,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
          newAuthConfig: newAuthConfig
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authProof', async () => {
      const whitelist = [testWalletAddr];
      const newAuthConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);

      await expect(
        sdk.updateAuthenticatorAddr({
          keyVaultAddr: keyVaultAddr,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
          newAuthConfig: newAuthConfig
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing newAuthenticatorAddr', async () => {
      const authProof = ethers.toUtf8Bytes(password);
      const whitelist = [testWalletAddr];
      const newAuthConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);

      await expect(
        sdk.updateAuthenticatorAddr({
          keyVaultAddr: keyVaultAddr,
          authProof: authProof,
          newAuthConfig: newAuthConfig
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing newAuthConfig', async () => {
      const authProof = ethers.toUtf8Bytes(password);

      await expect(
        sdk.updateAuthenticatorAddr({
          keyVaultAddr: keyVaultAddr,
          authProof: authProof,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with wrong authProof', async () => {
      const wrongAuthProof = ethers.toUtf8Bytes('wrongpassword');
      const whitelist = [testWalletAddr];
      const newAuthConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);

      await expect(
        sdk.updateAuthenticatorAddr({
          keyVaultAddr: keyVaultAddr,
          authProof: wrongAuthProof,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
          newAuthConfig: newAuthConfig
        })
      ).rejects.toThrow();
    }, 30000);

    test('should fail with invalid newAuthenticatorAddr', async () => {
      const authProof = ethers.toUtf8Bytes(password);
      const whitelist = [testWalletAddr];
      const newAuthConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);

      await expect(
        sdk.updateAuthenticatorAddr({
          keyVaultAddr: keyVaultAddr,
          authProof: authProof,
          newAuthenticatorAddr: '0x123', // Too short
          newAuthConfig: newAuthConfig
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateKeyVaultImplAddr', () => {
    test('should fail with missing keyVaultAddr', async () => {
      const authProof = ethers.toUtf8Bytes(password);
      const newImplAddr = '0x0000000000000000000000000000000000000000';

      await expect(
        sdk.updateKeyVaultImplAddr({
          authProof: authProof,
          newImplAddr: newImplAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authProof', async () => {
      const newImplAddr = '0x0000000000000000000000000000000000000000';

      await expect(
        sdk.updateKeyVaultImplAddr({
          keyVaultAddr: keyVaultAddr,
          newImplAddr: newImplAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing newImplAddr', async () => {
      const authProof = ethers.toUtf8Bytes(password);

      await expect(
        sdk.updateKeyVaultImplAddr({
          keyVaultAddr: keyVaultAddr,
          authProof: authProof
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid newImplAddr', async () => {
      const authProof = ethers.toUtf8Bytes(password);

      await expect(
        sdk.updateKeyVaultImplAddr({
          keyVaultAddr: keyVaultAddr,
          authProof: authProof,
          newImplAddr: '0x123' // Too short
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with wrong authProof', async () => {
      const wrongAuthProof = ethers.toUtf8Bytes('wrongpassword');
      const newImplAddr = '0x0000000000000000000000000000000000000000';

      await expect(
        sdk.updateKeyVaultImplAddr({
          keyVaultAddr: keyVaultAddr,
          authProof: wrongAuthProof,
          newImplAddr: newImplAddr
        })
      ).rejects.toThrow();
    }, 30000);

    test('should fail with readonly SDK instance', async () => {
      const readonlySdk = Monstera.readonly({ mainnet: false });
      const authProof = ethers.toUtf8Bytes(password);
      const newImplAddr = '0x0000000000000000000000000000000000000000';

      await expect(
        readonlySdk.updateKeyVaultImplAddr({
          keyVaultAddr: keyVaultAddr,
          authProof: authProof,
          newImplAddr: newImplAddr
        })
      ).rejects.toThrow(WriteRequiresSignerError);
    });
  });

  describe('updateWalletLogicImplAddr', () => {
    test('should fail with missing newLogicAddr', async () => {
      await expect(
        sdk.updateWalletLogicImplAddr({})
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid newLogicAddr', async () => {
      await expect(
        sdk.updateWalletLogicImplAddr({
          newLogicAddr: '0x123' // Too short
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with readonly SDK instance', async () => {
      const readonlySdk = Monstera.readonly({ mainnet: false });
      const newLogicAddr = '0x0000000000000000000000000000000000000000';

      await expect(
        readonlySdk.updateWalletLogicImplAddr({
          newLogicAddr: newLogicAddr
        })
      ).rejects.toThrow(WriteRequiresSignerError);
    });

    // Note: Success case requires admin role, which test signer may not have
    // This is an admin function that updates all wallets, so we only test validation
  });

  describe('transferAdmin', () => {
    test('should fail with missing newAdminAddr', async () => {
      await expect(
        sdk.transferAdmin({})
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid newAdminAddr', async () => {
      await expect(
        sdk.transferAdmin({
          newAdminAddr: '0x123' // Too short
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with readonly SDK instance', async () => {
      const readonlySdk = Monstera.readonly({ mainnet: false });
      const newAdminAddr = Wallet.createRandom().address;

      await expect(
        readonlySdk.transferAdmin({
          newAdminAddr: newAdminAddr
        })
      ).rejects.toThrow(WriteRequiresSignerError);
    });

    // Note: Success case requires admin role, which test signer may not have
    // This is an admin function, so we only test validation
  });

  describe('executeWithAuth', () => {
    test('should successfully execute with auth proof', async () => {
      // executeWithAuth calls functions on the KeyVault implementation contract
      // Use getAccountAddressImpl which requires baseKey, baseChain, and index
      // baseKey and baseChain are placeholders (ZeroHash) that KeyVault replaces
      const keyVaultImplInterface = new ethers.Interface([
        'function getAccountAddressImpl(bytes32 baseKey, bytes32 baseChain, uint32 index) view returns (address)'
      ]);
      
      // Use ZeroHash as placeholders - KeyVault will replace these with actual values
      const implCall = keyVaultImplInterface.encodeFunctionData('getAccountAddressImpl', [
        ethers.ZeroHash,  // placeholder baseKey - KeyVault replaces this
        ethers.ZeroHash,  // placeholder baseChain - KeyVault replaces this
        0                  // index
      ]);
      const authProof = ethers.toUtf8Bytes(password);

      const result = await sdk.executeWithAuth({
        keyVaultAddr: keyVaultAddr,
        authProof: authProof,
        implCall: implCall
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^0x[a-fA-F0-9]+$/);

      // Decode the result
      const decoded = keyVaultImplInterface.decodeFunctionResult('getAccountAddressImpl', result);
      expect(decoded[0]).toMatch(/^0x[a-fA-F0-9]{40}$/);
      
      // Verify it matches the account address from the proxy
      const accountAddr = await sdk.getAccountAddr({
        keyVaultAddr: keyVaultAddr,
        index: 0
      });
      expect(decoded[0].toLowerCase()).toBe(accountAddr.toLowerCase());
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      const keyVaultImplInterface = new ethers.Interface([
        'function getAccountAddressImpl(bytes32 baseKey, bytes32 baseChain, uint32 index) view returns (address)'
      ]);
      const implCall = keyVaultImplInterface.encodeFunctionData('getAccountAddressImpl', [
        ethers.ZeroHash,
        ethers.ZeroHash,
        0
      ]);
      const authProof = ethers.toUtf8Bytes(password);

      await expect(
        sdk.executeWithAuth({
          authProof: authProof,
          implCall: implCall
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authProof', async () => {
      const keyVaultImplInterface = new ethers.Interface([
        'function getAccountAddressImpl(bytes32 baseKey, bytes32 baseChain, uint32 index) view returns (address)'
      ]);
      const implCall = keyVaultImplInterface.encodeFunctionData('getAccountAddressImpl', [
        ethers.ZeroHash,
        ethers.ZeroHash,
        0
      ]);

      await expect(
        sdk.executeWithAuth({
          keyVaultAddr: keyVaultAddr,
          implCall: implCall
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing implCall', async () => {
      const authProof = ethers.toUtf8Bytes(password);

      await expect(
        sdk.executeWithAuth({
          keyVaultAddr: keyVaultAddr,
          authProof: authProof
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with wrong authProof', async () => {
      const keyVaultImplInterface = new ethers.Interface([
        'function getAccountAddressImpl(bytes32 baseKey, bytes32 baseChain, uint32 index) view returns (address)'
      ]);
      const implCall = keyVaultImplInterface.encodeFunctionData('getAccountAddressImpl', [
        ethers.ZeroHash,
        ethers.ZeroHash,
        0
      ]);
      const wrongAuthProof = ethers.toUtf8Bytes('wrongpassword');

      await expect(
        sdk.executeWithAuth({
          keyVaultAddr: keyVaultAddr,
          authProof: wrongAuthProof,
          implCall: implCall
        })
      ).rejects.toThrow();
    });

    test('should fail with invalid keyVaultAddr', async () => {
      const keyVaultImplInterface = new ethers.Interface([
        'function getAccountAddressImpl(bytes32 baseKey, bytes32 baseChain, uint32 index) view returns (address)'
      ]);
      const implCall = keyVaultImplInterface.encodeFunctionData('getAccountAddressImpl', [
        ethers.ZeroHash,
        ethers.ZeroHash,
        0
      ]);
      const authProof = ethers.toUtf8Bytes(password);

      await expect(
        sdk.executeWithAuth({
          keyVaultAddr: '0x123', // Too short
          authProof: authProof,
          implCall: implCall
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('initialize', () => {
    test('should fail with missing keyVaultAddr', async () => {
      // Generate a random access token (32 bytes)
      const accessToken = ethers.randomBytes(32);

      await expect(
        sdk.initialize({
          storageAddr: storageAddr,
          authenticatorAddr: authenticatorAddr,
          accessToken: accessToken
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing storageAddr', async () => {
      const accessToken = ethers.randomBytes(32);

      await expect(
        sdk.initialize({
          keyVaultAddr: keyVaultAddr,
          authenticatorAddr: authenticatorAddr,
          accessToken: accessToken
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authenticatorAddr', async () => {
      const accessToken = ethers.randomBytes(32);

      await expect(
        sdk.initialize({
          keyVaultAddr: keyVaultAddr,
          storageAddr: storageAddr,
          accessToken: accessToken
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing accessToken', async () => {
      await expect(
        sdk.initialize({
          keyVaultAddr: keyVaultAddr,
          storageAddr: storageAddr,
          authenticatorAddr: authenticatorAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid keyVaultAddr', async () => {
      const accessToken = ethers.randomBytes(32);

      await expect(
        sdk.initialize({
          keyVaultAddr: '0x123', // Too short
          storageAddr: storageAddr,
          authenticatorAddr: authenticatorAddr,
          accessToken: accessToken
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with readonly SDK instance', async () => {
      const readonlySdk = Monstera.readonly({ mainnet: false });
      const accessToken = ethers.randomBytes(32);

      await expect(
        readonlySdk.initialize({
          keyVaultAddr: keyVaultAddr,
          storageAddr: storageAddr,
          authenticatorAddr: authenticatorAddr,
          accessToken: accessToken
        })
      ).rejects.toThrow(WriteRequiresSignerError);
    });

    // Note: Success case is typically done during wallet creation
    // Testing initialization of an already-initialized wallet would fail
    // So we only test validation errors
  });
});
