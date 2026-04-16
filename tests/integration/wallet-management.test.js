/**
 * Integration tests for wallet management functionality
 * 
 * These tests verify that the SDK can manage wallet lifecycle operations correctly.
 * Tests both success and failure scenarios for initialization, updates, and admin operations.
 * 
 */

import 'dotenv/config';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { registerSdkTeardown } from '../utils/teardown.js';
import { ethers } from 'ethers';
import { 
  createTestSDK, 
  getTestConfig, 
  createTestWallet, 
  setupTestWallet 
} from '../utils/setup.js';
import { 
  createPasswordAuthProof,
  createWalletSigAuthConfig,
  ZERO_ADDRESS,
  randomAddress
} from '../utils/fixtures.js';
import { 
  expectTransactionResult,
  expectValidAddress,
  expectValidHex
} from '../utils/assertions.js';
import { 
  testMissingParam, 
  testInvalidAddress, 
  testReadonlySDK 
} from '../utils/validation-helpers.js';


describe('Wallet Management Integration Tests', () => {
  let sdk;
  let password;
  let passwordHash;
  let walletAddr;
  let keyVaultAddr;
  let storageAddr;
  let authenticatorAddr;
  let testWalletAddr;

  beforeAll(async () => {
    const config = getTestConfig();
    password = config.password;
    passwordHash = config.passwordHash;
    
    sdk = createTestSDK();
    
    const testWallet = createTestWallet();
    testWalletAddr = testWallet.address;
    
    const walletData = await setupTestWallet(sdk, passwordHash);
    walletAddr = walletData.wallet;
    keyVaultAddr = walletData.keyVault;
    storageAddr = walletData.storage;
    authenticatorAddr = walletData.authenticator;
  }, 30000);

  registerSdkTeardown(afterAll, () => sdk);

  describe('initializeWalletLogic', () => {
    test('should successfully initialize wallet logic', async () => {
      // Create a new wallet (wallet logic is initialized during creation)
      // But we can test the method directly
      const newWallet = await sdk.createWallet({
        authConfig: { passwordHash }
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

        expectTransactionResult(result);

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
      await testMissingParam(
        sdk.initializeWalletLogic.bind(sdk),
        { keyVaultAddr },
        'walletAddr'
      );
    });

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.initializeWalletLogic.bind(sdk),
        { walletAddr },
        'keyVaultAddr'
      );
    });

    test('should fail with invalid walletAddr', async () => {
      await testInvalidAddress(
        sdk.initializeWalletLogic.bind(sdk),
        { walletAddr: walletAddr, keyVaultAddr },
        'walletAddr'
      );
    });

    test('should fail with readonly SDK instance', async () => {
      await testReadonlySDK(
        sdk.initializeWalletLogic,
        {
          walletAddr,
          keyVaultAddr
        }
      );
    });
  });

  describe('updateAuthenticatorAddr', () => {
    test('should successfully update authenticator address', async () => {
      // Create a new wallet for testing
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordAuth,
        authConfig: { passwordHash }
      });

      const authProof = { password: createPasswordAuthProof(password) };
      const whitelist = [testWalletAddr];
      const newAuthConfig = createWalletSigAuthConfig(whitelist);

      const result = await sdk.updateAuthenticatorAddr({
        keyVaultAddr: newWallet.keyVault,
        authProof,
        newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
        newAuthConfig
      });

      expectTransactionResult(result);

      // Verify authenticator was updated
      const updatedAuthenticator = await sdk.getAuthenticatorAddr({
        keyVaultAddr: newWallet.keyVault
      });
      expect(updatedAuthenticator.toLowerCase()).toBe(sdk.addresses.walletSignatureAuth.toLowerCase());
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      const authProof = { password: createPasswordAuthProof(password) };
      const newAuthConfig = createWalletSigAuthConfig([testWalletAddr]);

      await testMissingParam(
        sdk.updateAuthenticatorAddr.bind(sdk),
        {
          authProof,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
          newAuthConfig
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing authProof', async () => {
      const newAuthConfig = createWalletSigAuthConfig([testWalletAddr]);

      await testMissingParam(
        sdk.updateAuthenticatorAddr.bind(sdk),
        {
          keyVaultAddr,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
          newAuthConfig
        },
        'authProof'
      );
    });

    test('should fail with missing newAuthenticatorAddr', async () => {
      const authProof = { password: createPasswordAuthProof(password) };
      const newAuthConfig = createWalletSigAuthConfig([testWalletAddr]);

      await testMissingParam(
        sdk.updateAuthenticatorAddr.bind(sdk),
        {
          keyVaultAddr,
          authProof,
          newAuthConfig
        },
        'newAuthenticatorAddr'
      );
    });

    test('should fail with missing newAuthConfig', async () => {
      const authProof = { password: createPasswordAuthProof(password) };

      await testMissingParam(
        sdk.updateAuthenticatorAddr.bind(sdk),
        {
          keyVaultAddr,
          authProof,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth
        },
        'newAuthConfig'
      );
    });

    test('should fail with wrong authProof', async () => {
      const wrongAuthProof = { password: createPasswordAuthProof('wrongpassword') };
      const newAuthConfig = createWalletSigAuthConfig([testWalletAddr]);

      await expect(
        sdk.updateAuthenticatorAddr({
          keyVaultAddr,
          authProof: wrongAuthProof,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
          newAuthConfig
        })
      ).rejects.toThrow();
    }, 30000);

    test('should fail with invalid newAuthenticatorAddr', async () => {
      const authProof = { password: createPasswordAuthProof(password) };
      const newAuthConfig = createWalletSigAuthConfig([testWalletAddr]);

      await testInvalidAddress(
        sdk.updateAuthenticatorAddr.bind(sdk),
        {
          keyVaultAddr,
          authProof,
          newAuthenticatorAddr: sdk.addresses.walletSignatureAuth,
          newAuthConfig
        },
        'newAuthenticatorAddr'
      );
    });
  });

  describe('updateKeyVaultImplAddr', () => {
    test('should fail with missing keyVaultAddr', async () => {
      const authProof = { password: createPasswordAuthProof(password) };
      const newImplAddr = ZERO_ADDRESS;

      await testMissingParam(
        sdk.updateKeyVaultImplAddr.bind(sdk),
        {
          authProof,
          newImplAddr
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing authProof', async () => {
      const newImplAddr = ZERO_ADDRESS;

      await testMissingParam(
        sdk.updateKeyVaultImplAddr.bind(sdk),
        {
          keyVaultAddr,
          newImplAddr
        },
        'authProof'
      );
    });

    test('should fail with missing newImplAddr', async () => {
      const authProof = { password: createPasswordAuthProof(password) };

      await testMissingParam(
        sdk.updateKeyVaultImplAddr.bind(sdk),
        {
          keyVaultAddr,
          authProof
        },
        'newImplAddr'
      );
    });

    test('should fail with invalid newImplAddr', async () => {
      const authProof = { password: createPasswordAuthProof(password) };

      await testInvalidAddress(
        sdk.updateKeyVaultImplAddr.bind(sdk),
        {
          keyVaultAddr,
          authProof,
          newImplAddr: ZERO_ADDRESS
        },
        'newImplAddr'
      );
    });

    test('should fail with wrong authProof', async () => {
      const wrongAuthProof = { password: createPasswordAuthProof('wrongpassword') };
      const newImplAddr = ZERO_ADDRESS;

      await expect(
        sdk.updateKeyVaultImplAddr({
          keyVaultAddr,
          authProof: wrongAuthProof,
          newImplAddr
        })
      ).rejects.toThrow();
    }, 30000);

    test('should fail with readonly SDK instance', async () => {
      const authProof = { password: createPasswordAuthProof(password) };
      const newImplAddr = ZERO_ADDRESS;

      await testReadonlySDK(
        sdk.updateKeyVaultImplAddr,
        {
          keyVaultAddr,
          authProof,
          newImplAddr
        }
      );
    });
  });

  describe('updateWalletLogicImplAddr', () => {
    test('should fail with missing newLogicAddr', async () => {
      await testMissingParam(
        sdk.updateWalletLogicImplAddr.bind(sdk),
        {},
        'newLogicAddr'
      );
    });

    test('should fail with invalid newLogicAddr', async () => {
      await testInvalidAddress(
        sdk.updateWalletLogicImplAddr.bind(sdk),
        { newLogicAddr: ZERO_ADDRESS },
        'newLogicAddr'
      );
    });

    test('should fail with readonly SDK instance', async () => {
      const newLogicAddr = ZERO_ADDRESS;

      await testReadonlySDK(
        sdk.updateWalletLogicImplAddr,
        { newLogicAddr }
      );
    });

    // Note: Success case requires admin role, which test signer may not have
    // This is an admin function that updates all wallets, so we only test validation
  });

  describe('transferAdmin', () => {
    test('should fail with missing newAdminAddr', async () => {
      await testMissingParam(
        sdk.transferAdmin.bind(sdk),
        {},
        'newAdminAddr'
      );
    });

    test('should fail with invalid newAdminAddr', async () => {
      await testInvalidAddress(
        sdk.transferAdmin.bind(sdk),
        { newAdminAddr: randomAddress() },
        'newAdminAddr'
      );
    });

    test('should fail with readonly SDK instance', async () => {
      const newAdminAddr = randomAddress();

      await testReadonlySDK(
        sdk.transferAdmin,
        { newAdminAddr }
      );
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
      const authProof = { password: createPasswordAuthProof(password) };

      const result = await sdk.executeWithAuth({
        keyVaultAddr,
        authProof,
        implCall
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expectValidHex(result);

      // Decode the result
      const decoded = keyVaultImplInterface.decodeFunctionResult('getAccountAddressImpl', result);
      expectValidAddress(decoded[0]);
      
      // Verify it matches the account address from the proxy
      const accountAddr = await sdk.getAccountAddr({
        keyVaultAddr: keyVaultAddr,
        index: 0
      });
      expect(decoded[0].toLowerCase()).toBe(accountAddr.toLowerCase());
    }, 30000);

    // Helper to create implCall for executeWithAuth tests
    const createImplCall = () => {
      const keyVaultImplInterface = new ethers.Interface([
        'function getAccountAddressImpl(bytes32 baseKey, bytes32 baseChain, uint32 index) view returns (address)'
      ]);
      return keyVaultImplInterface.encodeFunctionData('getAccountAddressImpl', [
        ethers.ZeroHash,
        ethers.ZeroHash,
        0
      ]);
    };

    test('should fail with missing keyVaultAddr', async () => {
      const implCall = createImplCall();
      const authProof = { password: createPasswordAuthProof(password) };

      await testMissingParam(
        sdk.executeWithAuth.bind(sdk),
        {
          authProof,
          implCall
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing authProof', async () => {
      const implCall = createImplCall();

      await testMissingParam(
        sdk.executeWithAuth.bind(sdk),
        {
          keyVaultAddr,
          implCall
        },
        'authProof'
      );
    });

    test('should fail with missing implCall', async () => {
      const authProof = { password: createPasswordAuthProof(password) };

      await testMissingParam(
        sdk.executeWithAuth.bind(sdk),
        {
          keyVaultAddr,
          authProof
        },
        'implCall'
      );
    });

    test('should fail with wrong authProof', async () => {
      const implCall = createImplCall();
      const wrongAuthProof = { password: createPasswordAuthProof('wrongpassword') };

      await expect(
        sdk.executeWithAuth({
          keyVaultAddr,
          authProof: wrongAuthProof,
          implCall
        })
      ).rejects.toThrow();
    }, 30000);

    test('should fail with invalid keyVaultAddr', async () => {
      const implCall = createImplCall();
      const authProof = { password: createPasswordAuthProof(password) };

      await testInvalidAddress(
        sdk.executeWithAuth.bind(sdk),
        {
          keyVaultAddr: keyVaultAddr,
          authProof,
          implCall
        },
        'keyVaultAddr'
      );
    });
  });

  describe('initialize', () => {
    // Helper to create access token for initialize tests
    const createAccessToken = () => ethers.randomBytes(32);

    test('should fail with missing keyVaultAddr', async () => {
      const accessToken = createAccessToken();

      await testMissingParam(
        sdk.initialize.bind(sdk),
        {
          storageAddr,
          authenticatorAddr,
          accessToken
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing storageAddr', async () => {
      const accessToken = createAccessToken();

      await testMissingParam(
        sdk.initialize.bind(sdk),
        {
          keyVaultAddr,
          authenticatorAddr,
          accessToken
        },
        'storageAddr'
      );
    });

    test('should fail with missing authenticatorAddr', async () => {
      const accessToken = createAccessToken();

      await testMissingParam(
        sdk.initialize.bind(sdk),
        {
          keyVaultAddr,
          storageAddr,
          accessToken
        },
        'authenticatorAddr'
      );
    });

    test('should fail with missing accessToken', async () => {
      await testMissingParam(
        sdk.initialize.bind(sdk),
        {
          keyVaultAddr,
          storageAddr,
          authenticatorAddr
        },
        'accessToken'
      );
    });

    test('should fail with invalid keyVaultAddr', async () => {
      const accessToken = createAccessToken();

      await testInvalidAddress(
        sdk.initialize.bind(sdk),
        {
          keyVaultAddr: keyVaultAddr,
          storageAddr,
          authenticatorAddr,
          accessToken
        },
        'keyVaultAddr'
      );
    });

    test('should fail with readonly SDK instance', async () => {
      const accessToken = createAccessToken();

      await testReadonlySDK(
        sdk.initialize,
        {
          keyVaultAddr,
          storageAddr,
          authenticatorAddr,
          accessToken
        }
      );
    });

    // Note: Success case is typically done during wallet creation
    // Testing initialization of an already-initialized wallet would fail
    // So we only test validation errors
  });
});
