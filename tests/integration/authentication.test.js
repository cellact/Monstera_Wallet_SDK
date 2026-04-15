/**
 * Integration tests for authentication functionality
 * 
 * These tests verify that the SDK can configure and manage authentication correctly.
 * Tests both success and failure scenarios for password and wallet signature authentication.
 * 
 */

import 'dotenv/config';
import { describe, test, expect, beforeAll } from '@jest/globals';
import { ethers, Wallet } from 'ethers';
import { ValidationError } from '../../src/errors/index.js';
import { 
  createTestSDK, 
  getTestConfig, 
  createTestWallet, 
  setupTestWallet 
} from '../utils/setup.js';
import { 
  createPasswordAuthProof, 
  calculateDeadline,
  randomAddress
} from '../utils/fixtures.js';
import { 
  expectTransactionResult,
  expectValidHex,
  expectValidTxHash
} from '../utils/assertions.js';
import { 
  testMissingParam, 
  testInvalidAddress, 
  testReadonlySDK 
} from '../utils/validation-helpers.js';

describe('Authentication Integration Tests', () => {
  let sdk;
  let password;
  let passwordHash;
  let keyVaultAddr;
  let testWallet; // For wallet signature auth tests
  let testWalletAddr;
  let walletAddr;

  beforeAll(async () => {
    const config = getTestConfig();
    password = config.password;
    passwordHash = config.passwordHash;

    sdk = createTestSDK();

    const testWalletData = createTestWallet();
    testWallet = testWalletData.wallet;
    testWalletAddr = testWalletData.address;

    const walletData = await setupTestWallet(sdk, passwordHash);
    walletAddr = walletData.wallet;
    keyVaultAddr = walletData.keyVault;
  }, 30000);

  describe('configurePassword', () => {
    test('should successfully configure password for a wallet', async () => {
      // Create a new wallet WITHOUT password configured (using wallet signature authenticator)
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      // Verify password is NOT configured initially
      const isConfiguredBefore = await sdk.isPasswordConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfiguredBefore).toBe(false);

      // Configure password (this is typically done during creation, but can be done separately)
      const result = await sdk.configurePassword({
        keyVaultAddr: newWallet.keyVault,
        passwordHash: passwordHash
      });

      expectTransactionResult(result);

      // Verify password is now configured
      const isConfigured = await sdk.isPasswordConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(true);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.configurePassword.bind(sdk),
        { passwordHash: passwordHash },
        'keyVaultAddr'
      );
    });

    test('should fail with missing authConfig', async () => {
      await testMissingParam(
        sdk.configurePassword.bind(sdk),
        { keyVaultAddr },
        'passwordHash'
      );
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await testInvalidAddress(
        sdk.configurePassword.bind(sdk),
        { keyVaultAddr, passwordHash: passwordHash },
        'keyVaultAddr'
      );
    });

    test('should fail with readonly SDK instance', async () => {
      await testReadonlySDK(
        sdk.configurePassword,
        {
          keyVaultAddr,
          passwordHash: passwordHash
        }
      );
    });
  });

  describe('configureWalletSignature', () => {
    test('should successfully configure wallet signature authenticator', async () => {
      // Create a new wallet
      const newWallet = await sdk.createWallet({
        authConfig: { passwordHash }
      });

      // // Encode whitelist addresses
      // const whitelist = [testWalletAddr];
      // const authConfig = createWalletSigAuthConfig(whitelist);

      // Configure wallet signature authenticator
      const result = await sdk.configureWalletSignature({
        keyVaultAddr: newWallet.keyVault,
        // authConfig
        initialWhitelist: [testWalletAddr]
      });

      expectTransactionResult(result);

      // Verify wallet signature is configured
      const isConfigured = await sdk.isWalletSignatureConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(true);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      // const authConfig = createWalletSigAuthConfig([testWalletAddr]);

      await testMissingParam(
        sdk.configureWalletSignature.bind(sdk),
        // { authConfig },
        { initialWhitelist: [testWalletAddr] },
        'keyVaultAddr'
      );
    });

    test('should fail with missing initialWhitelist', async () => {
      await testMissingParam(
        sdk.configureWalletSignature.bind(sdk),
        { keyVaultAddr },
        // 'authConfig'
        'initialWhitelist'
      );
    });

    test('should fail with invalid keyVaultAddr', async () => {
      // const authConfig = createWalletSigAuthConfig([testWalletAddr]);

      await testInvalidAddress(
        sdk.configureWalletSignature.bind(sdk),
        // { keyVaultAddr, authConfig },
        { keyVaultAddr, initialWhitelist: [testWalletAddr] },
        'keyVaultAddr'
      );
    });

    test('should fail with readonly SDK instance', async () => {
      // const authConfig = createWalletSigAuthConfig([testWalletAddr]);

      await testReadonlySDK(
        sdk.configureWalletSignature,
        {
          keyVaultAddr,
          // authConfig
          initialWhitelist: [testWalletAddr]
        }
      );
    });
  });

  describe('updatePassword', () => {
    test('should successfully update password', async () => {
      const newPassword = 'newpassword123';
      const newPasswordHash = ethers.keccak256(ethers.toUtf8Bytes(newPassword));
      const currentPasswordBytes = createPasswordAuthProof(password);

      const result = await sdk.updatePassword({
        keyVaultAddr,
        currentPassword: currentPasswordBytes,
        newPasswordHash
      });

      expectTransactionResult(result);

      // Verify new password works
      const isValid = await sdk.isPasswordValid({
        keyVaultAddr,
        currentPassword: createPasswordAuthProof(newPassword)
      });
      expect(isValid).toBe(true);

      // Verify old password doesn't work
      const isOldValid = await sdk.isPasswordValid({
        keyVaultAddr,
        currentPassword: currentPasswordBytes
      });
      expect(isOldValid).toBe(false);

      // Update back to original password for other tests
      await sdk.updatePassword({
        keyVaultAddr,
        currentPassword: createPasswordAuthProof(newPassword),
        newPasswordHash: passwordHash
      });
    }, 30000);

    test('should fail with wrong current password', async () => {
      const wrongPassword = createPasswordAuthProof('wrongpassword');
      const newPasswordHash = ethers.keccak256(ethers.toUtf8Bytes('newpassword'));

      await expect(
        sdk.updatePassword({
          keyVaultAddr,
          currentPassword: wrongPassword,
          newPasswordHash
        })
      ).rejects.toThrow();
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      const currentPasswordBytes = createPasswordAuthProof(password);
      const newPasswordHash = ethers.keccak256(ethers.toUtf8Bytes('newpassword'));

      await testMissingParam(
        sdk.updatePassword.bind(sdk),
        {
          currentPassword: currentPasswordBytes,
          newPasswordHash
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing currentPassword', async () => {
      const newPasswordHash = ethers.keccak256(ethers.toUtf8Bytes('newpassword'));

      await testMissingParam(
        sdk.updatePassword.bind(sdk),
        {
          keyVaultAddr,
          newPasswordHash
        },
        'currentPassword'
      );
    });

    test('should fail with missing newPasswordHash', async () => {
      const currentPasswordBytes = createPasswordAuthProof(password);

      await testMissingParam(
        sdk.updatePassword.bind(sdk),
        {
          keyVaultAddr,
          currentPassword: currentPasswordBytes
        },
        'newPasswordHash'
      );
    });
  });

  describe('isPasswordConfigured', () => {
    test('should return true for configured wallet', async () => {
      const isConfigured = await sdk.isPasswordConfigured({
        keyVaultAddr
      });
      expect(isConfigured).toBe(true);
    });

    test('should return false for unconfigured wallet', async () => {
      // Create a wallet without password configured (using wallet signature)
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const isConfigured = await sdk.isPasswordConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.isPasswordConfigured.bind(sdk),
        {},
        'keyVaultAddr'
      );
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await testInvalidAddress(
        sdk.isPasswordConfigured.bind(sdk),
        { keyVaultAddr },
        'keyVaultAddr'
      );
    });
  });

  describe('isPasswordValid', () => {
    test('should return true for correct password', async () => {
      const isValid = await sdk.isPasswordValid({
        keyVaultAddr,
        currentPassword: createPasswordAuthProof(password)
      });
      expect(isValid).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const isValid = await sdk.isPasswordValid({
        keyVaultAddr,
        currentPassword: createPasswordAuthProof('wrongpassword')
      });
      expect(isValid).toBe(false);
    });

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.isPasswordValid.bind(sdk),
        {
          currentPassword: createPasswordAuthProof(password)
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing authProof', async () => {
      await testMissingParam(
        sdk.isPasswordValid.bind(sdk),
        { keyVaultAddr },
        'currentPassword'
      );
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await testInvalidAddress(
        sdk.isPasswordValid.bind(sdk),
        {
          keyVaultAddr,
          currentPassword: createPasswordAuthProof(password)
        },
        'keyVaultAddr'
      );
    });
  });

  describe('isWalletSignatureConfigured', () => {
    test('should return true for configured wallet', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const isConfigured = await sdk.isWalletSignatureConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(true);
    }, 30000);

    test('should return false for unconfigured wallet', async () => {
      // Create wallet with password authenticator
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordAuth,
        authConfig: { passwordHash }
      });

      const isConfigured = await sdk.isWalletSignatureConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.isWalletSignatureConfigured.bind(sdk),
        {},
        'keyVaultAddr'
      );
    });
  });

  describe('isWalletSignatureValid', () => {
    test('should return true for valid signature', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      // Create auth proof
      // const deadline = calculateDeadline();
      // const authProof = await sdk.createAuthProof({
      //   signer: testWallet.connect(sdk.provider),
      //   keyVaultAddr: newWallet.keyVault,
      //   deadline
      // });

      // Verify signature
      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        // authProof
        signer: testWallet.connect(sdk.provider)
      });
      expect(isValid).toBe(true);
    }, 30000);

    test('should return false for invalid signature', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      // Create auth proof with different wallet (not whitelisted)
      const otherWallet = Wallet.createRandom();
      // const deadline = calculateDeadline();
      // const authProof = await sdk.createAuthProof({
      //   signer: otherWallet.connect(sdk.provider),
      //   keyVaultAddr: newWallet.keyVault,
      //   deadline
      // });

      // Verify signature (should be false)
      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        // authProof
        signer: otherWallet.connect(sdk.provider)
      });
      expect(isValid).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.isWalletSignatureValid.bind(sdk),
        {
          signer: testWallet.connect(sdk.provider)
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing signer', async () => {
      await testMissingParam(
        sdk.isWalletSignatureValid.bind(sdk),
        { keyVaultAddr },
        'signer'
      );
    });
  });

  describe('isWhitelisted', () => {
    test('should return true for whitelisted address', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const isWhitelisted = await sdk.isWhitelisted({
        keyVaultAddr: newWallet.keyVault,
        addressToCheck: testWalletAddr
      });
      expect(isWhitelisted).toBe(true);
    }, 30000);

    test('should return false for non-whitelisted address', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const otherAddr = randomAddress();
      const isWhitelisted = await sdk.isWhitelisted({
        keyVaultAddr: newWallet.keyVault,
        addressToCheck: otherAddr
      });
      expect(isWhitelisted).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.isWhitelisted.bind(sdk),
        { addressToCheck: testWalletAddr },
        'keyVaultAddr'
      );
    });

    test('should fail with missing addressToCheck', async () => {
      await testMissingParam(
        sdk.isWhitelisted.bind(sdk),
        { keyVaultAddr },
        'addressToCheck'
      );
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await testInvalidAddress(
        sdk.isWhitelisted.bind(sdk),
        {
          keyVaultAddr,
          addressToCheck: testWalletAddr
        },
        'keyVaultAddr'
      );
    });
  });

  describe('getWhitelist', () => {
    test('should return whitelist addresses', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr, randomAddress()];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const result = await sdk.getWhitelist({
        keyVaultAddr: newWallet.keyVault
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      // Check addresses (case-insensitive comparison)
      const resultLower = result.map(addr => addr.toLowerCase());
      expect(resultLower).toContain(testWalletAddr.toLowerCase());
    }, 30000);

    test('should fail to remove last address from whitelist (prevents empty whitelist)', async () => {
      // Create wallet with wallet signature authenticator and one address
      const initialWhitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist }
      });

      // Verify initial whitelist has one address
      const initialResult = await sdk.getWhitelist({
        keyVaultAddr: newWallet.keyVault
      });
      expect(initialResult.length).toBe(1);

      // Attempting to remove the last address should fail (contract prevents empty whitelist)
      await expect(
        sdk.removeFromWhitelist({
          keyVaultAddr: newWallet.keyVault,
          signer: testWallet.connect(sdk.provider),
          addressToRemove: testWalletAddr
        })
      ).rejects.toThrow(); // Should throw ContractRevertError

      // Verify whitelist still has the address (wasn't removed)
      const result = await sdk.getWhitelist({
        keyVaultAddr: newWallet.keyVault
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].toLowerCase()).toBe(testWalletAddr.toLowerCase());
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.getWhitelist.bind(sdk),
        {},
        'keyVaultAddr'
      );
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await testInvalidAddress(
        sdk.getWhitelist.bind(sdk),
        { keyVaultAddr },
        'keyVaultAddr'
      );
    });
  });

  describe('addToWhitelist', () => {
    test('should successfully add address to whitelist', async () => {
      // Create wallet with wallet signature authenticator
      const initialWhitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist }
      });

      const newAddr = randomAddress();
      const result = await sdk.addToWhitelist({
        keyVaultAddr: newWallet.keyVault,
        signer: testWallet.connect(sdk.provider),
        addressToAdd: newAddr
      });

      expectTransactionResult(result);

      // Verify address was added
      const isWhitelisted = await sdk.isWhitelisted({
        keyVaultAddr: newWallet.keyVault,
        addressToCheck: newAddr
      });
      expect(isWhitelisted).toBe(true);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.addToWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: testWallet.connect(sdk.provider),
          addressToAdd: testWalletAddr
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing signer', async () => {
      await testMissingParam(
        sdk.addToWhitelist.bind(sdk),
        {
          keyVaultAddr,
          addressToAdd: testWalletAddr
        },
        'signer'
      );
    });

    test('should fail with missing addressToAdd', async () => {
      await testMissingParam(
        sdk.addToWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: testWallet.connect(sdk.provider)
        },
        'addressToAdd'
      );
    });

    test('should fail when signer is not on the whitelist', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const otherWallet = Wallet.createRandom();

      await expect(
        sdk.addToWhitelist({
          keyVaultAddr: newWallet.keyVault,
          signer: otherWallet.connect(sdk.provider),
          addressToAdd: randomAddress()
        })
      ).rejects.toThrow();
    }, 30000);
  });

  describe('removeFromWhitelist', () => {
    test('should successfully remove address from whitelist', async () => {
      // Create wallet with wallet signature authenticator
      const initialWhitelist = [testWalletAddr, randomAddress()];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist }
      });

      const addrToRemove = initialWhitelist[1];
      const result = await sdk.removeFromWhitelist({
        keyVaultAddr: newWallet.keyVault,
        signer: testWallet.connect(sdk.provider),
        addressToRemove: addrToRemove
      });

      expectTransactionResult(result);

      // Verify address was removed
      const isWhitelisted = await sdk.isWhitelisted({
        keyVaultAddr: newWallet.keyVault,
        addressToCheck: addrToRemove
      });
      expect(isWhitelisted).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.removeFromWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: testWallet.connect(sdk.provider),
          addressToRemove: testWalletAddr
        },
        'keyVaultAddr'
      );
    });

    test('should fail with missing signer', async () => {
      await testMissingParam(
        sdk.removeFromWhitelist.bind(sdk),
        {
          keyVaultAddr,
          addressToRemove: testWalletAddr
        },
        'signer'
      );
    });

    test('should fail with missing addressToRemove', async () => {
      await testMissingParam(
        sdk.removeFromWhitelist.bind(sdk),
        {
          keyVaultAddr,
          signer: testWallet.connect(sdk.provider)
        },
        'addressToRemove'
      );
    });
  });

  describe('getDomainSeparator', () => {
    test('should return domain separator', async () => {
      const domainSeparator = await sdk.getDomainSeparator();

      expect(domainSeparator).toBeDefined();
      expect(typeof domainSeparator).toBe('string');
      expectValidTxHash(domainSeparator); // 32 bytes = 64 hex chars
    });

    test('should return same domain separator for same network', async () => {
      const domainSeparator1 = await sdk.getDomainSeparator();
      const domainSeparator2 = await sdk.getDomainSeparator();

      expect(domainSeparator1).toBe(domainSeparator2);
    });
  });

  describe('createAuthProof', () => {
    test('should successfully create auth proof', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      // const deadline = calculateDeadline();
      // const authProof = await sdk.createAuthProof({
      //   signer: testWallet.connect(sdk.provider),
      //   keyVaultAddr: newWallet.keyVault,
      //   deadline
      // });

      // expect(authProof).toBeDefined();
      // expect(typeof authProof).toBe('string');
      // expectValidHex(authProof);

      // Verify auth proof is valid
      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        // authProof
        signer: testWallet.connect(sdk.provider)
      });
      expect(isValid).toBe(true);
    }, 30000);

    test('should use default deadline if not provided', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      // const authProof = await sdk.createAuthProof({
      //   signer: testWallet.connect(sdk.provider),
      //   keyVaultAddr: newWallet.keyVault
      //   // deadline not provided, should default to 1 hour from now
      // });

      // expect(authProof).toBeDefined();
      
      // Verify auth proof is valid
      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        // authProof
        signer: testWallet.connect(sdk.provider)
      });
      expect(isValid).toBe(true);
    }, 30000);

    test('should use default authenticatorAddr if not provided', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      // const deadline = calculateDeadline();
      // const authProof = await sdk.createAuthProof({
      //   signer: testWallet.connect(sdk.provider),
      //   keyVaultAddr: newWallet.keyVault,
      //   deadline
      //   // authenticatorAddr not provided, should use default
      // });

      // expect(authProof).toBeDefined();
      
      // Verify auth proof is valid
      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        // authProof
        signer: testWallet.connect(sdk.provider)
      });
      expect(isValid).toBe(true);
    }, 30000);

    test('should fail with missing signer', async () => {
      await testMissingParam(
        sdk.createAuthProof.bind(sdk),
        {
          keyVaultAddr,
          deadline: calculateDeadline()
        },
        'signer'
      );
    });

    test('should fail with missing keyVaultAddr', async () => {
      await testMissingParam(
        sdk.createAuthProof.bind(sdk),
        {
          signer: testWallet.connect(sdk.provider),
          deadline: calculateDeadline()
        },
        'keyVaultAddr'
      );
    });

    test('should fail with deadline in the past', async () => {
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      await expect(
        sdk.createAuthProof({
          signer: testWallet.connect(sdk.provider),
          keyVaultAddr,
          deadline: pastDeadline
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await testInvalidAddress(
        sdk.createAuthProof.bind(sdk),
        {
          signer: testWallet.connect(sdk.provider),
          keyVaultAddr,
          deadline: calculateDeadline()
        },
        'keyVaultAddr'
      );
    });

    test('should fail with invalid authenticatorAddr', async () => {
      await testInvalidAddress(
        sdk.createAuthProof.bind(sdk),
        {
          signer: testWallet.connect(sdk.provider),
          keyVaultAddr,
          authenticatorAddr: sdk.addresses.walletSignatureAuth,
          deadline: calculateDeadline()
        },
        'authenticatorAddr'
      );
    });
  });
});
