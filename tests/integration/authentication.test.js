/**
 * Integration tests for authentication functionality
 * 
 * These tests verify that the SDK can configure and manage authentication correctly.
 * Tests both success and failure scenarios for password and wallet signature authentication.
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

describe('Authentication Integration Tests', () => {
  let sdk;
  let password;
  let passwordHash;
  let walletAddr;
  let keyVaultAddr;
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
    } else {
      walletAddr = process.env.WALLET_ADDRESS;
      keyVaultAddr = await sdk.getKeyVaultAddr({ walletAddr });
    }
  }, 30000);

  describe('configurePassword', () => {
    test('should successfully configure password for a wallet', async () => {
      // Create a new wallet WITHOUT password configured (using wallet signature authenticator)
      const whitelist = [testWalletAddr];
      const walletSigAuthConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: walletSigAuthConfig
      });

      // Verify password is NOT configured initially
      const isConfiguredBefore = await sdk.isPasswordConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfiguredBefore).toBe(false);

      // Configure password (this is typically done during creation, but can be done separately)
      const result = await sdk.configurePassword({
        keyVaultAddr: newWallet.keyVault,
        authConfig: passwordHash
      });

      expect(result).toBeDefined();
      expect(result.transactionHash).toBeDefined();
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Verify password is now configured
      const isConfigured = await sdk.isPasswordConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(true);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await expect(
        sdk.configurePassword({
          authConfig: passwordHash
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authConfig', async () => {
      await expect(
        sdk.configurePassword({
          keyVaultAddr: keyVaultAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await expect(
        sdk.configurePassword({
          keyVaultAddr: '0x123', // Too short
          authConfig: passwordHash
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with readonly SDK instance', async () => {
      const readonlySdk = Monstera.readonly({ mainnet: false });

      await expect(
        readonlySdk.configurePassword({
          keyVaultAddr: keyVaultAddr,
          authConfig: passwordHash
        })
      ).rejects.toThrow(WriteRequiresSignerError);
    });
  });

  describe('configureWalletSignature', () => {
    test('should successfully configure wallet signature authenticator', async () => {
      // Create a new wallet
      const newWallet = await sdk.createWallet({
        // authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: passwordHash
      });

      // Encode whitelist addresses
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);

      // Configure wallet signature authenticator
      const result = await sdk.configureWalletSignature({
        keyVaultAddr: newWallet.keyVault,
        authConfig: authConfig
      });

      expect(result).toBeDefined();
      expect(result.transactionHash).toBeDefined();
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Verify wallet signature is configured
      const isConfigured = await sdk.isWalletSignatureConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(true);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);

      await expect(
        sdk.configureWalletSignature({
          authConfig: authConfig
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authConfig', async () => {
      await expect(
        sdk.configureWalletSignature({
          keyVaultAddr: keyVaultAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid keyVaultAddr', async () => {
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);

      await expect(
        sdk.configureWalletSignature({
          keyVaultAddr: '0x123', // Too short
          authConfig: authConfig
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with readonly SDK instance', async () => {
      const readonlySdk = Monstera.readonly({ mainnet: false });
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);

      await expect(
        readonlySdk.configureWalletSignature({
          keyVaultAddr: keyVaultAddr,
          authConfig: authConfig
        })
      ).rejects.toThrow(WriteRequiresSignerError);
    });
  });

  describe('updatePassword', () => {
    test('should successfully update password', async () => {
      const newPassword = 'newpassword123';
      const newPasswordHash = ethers.keccak256(ethers.toUtf8Bytes(newPassword));
      const currentPasswordBytes = ethers.toUtf8Bytes(password);

      const result = await sdk.updatePassword({
        keyVaultAddr: keyVaultAddr,
        currentPassword: currentPasswordBytes,
        newPasswordHash: newPasswordHash
      });

      expect(result).toBeDefined();
      expect(result.transactionHash).toBeDefined();
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Verify new password works
      const isValid = await sdk.isPasswordValid({
        keyVaultAddr: keyVaultAddr,
        authProof: ethers.toUtf8Bytes(newPassword)
      });
      expect(isValid).toBe(true);

      // Verify old password doesn't work
      const isOldValid = await sdk.isPasswordValid({
        keyVaultAddr: keyVaultAddr,
        authProof: currentPasswordBytes
      });
      expect(isOldValid).toBe(false);

      // Update back to original password for other tests
      await sdk.updatePassword({
        keyVaultAddr: keyVaultAddr,
        currentPassword: ethers.toUtf8Bytes(newPassword),
        newPasswordHash: passwordHash
      });
    }, 30000);

    test('should fail with wrong current password', async () => {
      const wrongPassword = ethers.toUtf8Bytes('wrongpassword');
      const newPasswordHash = ethers.keccak256(ethers.toUtf8Bytes('newpassword'));

      await expect(
        sdk.updatePassword({
          keyVaultAddr: keyVaultAddr,
          currentPassword: wrongPassword,
          newPasswordHash: newPasswordHash
        })
      ).rejects.toThrow();
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      const currentPasswordBytes = ethers.toUtf8Bytes(password);
      const newPasswordHash = ethers.keccak256(ethers.toUtf8Bytes('newpassword'));

      await expect(
        sdk.updatePassword({
          currentPassword: currentPasswordBytes,
          newPasswordHash: newPasswordHash
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing currentPassword', async () => {
      const newPasswordHash = ethers.keccak256(ethers.toUtf8Bytes('newpassword'));

      await expect(
        sdk.updatePassword({
          keyVaultAddr: keyVaultAddr,
          newPasswordHash: newPasswordHash
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing newPasswordHash', async () => {
      const currentPasswordBytes = ethers.toUtf8Bytes(password);

      await expect(
        sdk.updatePassword({
          keyVaultAddr: keyVaultAddr,
          currentPassword: currentPasswordBytes
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('isPasswordConfigured', () => {
    test('should return true for configured wallet', async () => {
      const isConfigured = await sdk.isPasswordConfigured({
        keyVaultAddr: keyVaultAddr
      });
      expect(isConfigured).toBe(true);
    });

    test('should return false for unconfigured wallet', async () => {
      // Create a wallet without password configured (using wallet signature)
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
      });

      const isConfigured = await sdk.isPasswordConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await expect(
        sdk.isPasswordConfigured({})
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await expect(
        sdk.isPasswordConfigured({
          keyVaultAddr: '0x123' // Too short
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('isPasswordValid', () => {
    test('should return true for correct password', async () => {
      const isValid = await sdk.isPasswordValid({
        keyVaultAddr: keyVaultAddr,
        authProof: ethers.toUtf8Bytes(password)
      });
      expect(isValid).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const isValid = await sdk.isPasswordValid({
        keyVaultAddr: keyVaultAddr,
        authProof: ethers.toUtf8Bytes('wrongpassword')
      });
      expect(isValid).toBe(false);
    });

    test('should fail with missing keyVaultAddr', async () => {
      await expect(
        sdk.isPasswordValid({
          authProof: ethers.toUtf8Bytes(password)
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authProof', async () => {
      await expect(
        sdk.isPasswordValid({
          keyVaultAddr: keyVaultAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await expect(
        sdk.isPasswordValid({
          keyVaultAddr: '0x123', // Too short
          authProof: ethers.toUtf8Bytes(password)
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('isWalletSignatureConfigured', () => {
    test('should return true for configured wallet', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
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
        authConfig: passwordHash
      });

      const isConfigured = await sdk.isWalletSignatureConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await expect(
        sdk.isWalletSignatureConfigured({})
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('isWalletSignatureValid', () => {
    test('should return true for valid signature', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
      });

      // Create auth proof
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: newWallet.keyVault,
        deadline: deadline
      });

      // Verify signature
      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        authProof: authProof
      });
      expect(isValid).toBe(true);
    }, 30000);

    test('should return false for invalid signature', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
      });

      // Create auth proof with different wallet (not whitelisted)
      const otherWallet = Wallet.createRandom();
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const authProof = await sdk.createAuthProof({
        signer: otherWallet.connect(sdk.provider),
        keyVaultAddr: newWallet.keyVault,
        deadline: deadline
      });

      // Verify signature (should be false)
      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        authProof: authProof
      });
      expect(isValid).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: keyVaultAddr,
        deadline: deadline
      });

      await expect(
        sdk.isWalletSignatureValid({
          authProof: authProof
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authProof', async () => {
      await expect(
        sdk.isWalletSignatureValid({
          keyVaultAddr: keyVaultAddr
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('isWhitelisted', () => {
    test('should return true for whitelisted address', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
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
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
      });

      const otherAddr = Wallet.createRandom().address;
      const isWhitelisted = await sdk.isWhitelisted({
        keyVaultAddr: newWallet.keyVault,
        addressToCheck: otherAddr
      });
      expect(isWhitelisted).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      await expect(
        sdk.isWhitelisted({
          addressToCheck: testWalletAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing addressToCheck', async () => {
      await expect(
        sdk.isWhitelisted({
          keyVaultAddr: keyVaultAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await expect(
        sdk.isWhitelisted({
          keyVaultAddr: '0x123', // Too short
          addressToCheck: testWalletAddr
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getWhitelist', () => {
    test('should return whitelist addresses', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr, Wallet.createRandom().address];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
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
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [initialWhitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
      });

      // Verify initial whitelist has one address
      const initialResult = await sdk.getWhitelist({
        keyVaultAddr: newWallet.keyVault
      });
      expect(initialResult.length).toBe(1);

      // Create auth proof to remove the address
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: newWallet.keyVault,
        deadline: deadline
      });

      // Attempting to remove the last address should fail (contract prevents empty whitelist)
      await expect(
        sdk.removeFromWhitelist({
          keyVaultAddr: newWallet.keyVault,
          authProof: authProof,
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
      await expect(
        sdk.getWhitelist({})
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await expect(
        sdk.getWhitelist({
          keyVaultAddr: '0x123' // Too short
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('addToWhitelist', () => {
    test('should successfully add address to whitelist', async () => {
      // Create wallet with wallet signature authenticator
      const initialWhitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [initialWhitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
      });

      // Create auth proof
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: newWallet.keyVault,
        deadline: deadline
      });

      // Add new address to whitelist
      const newAddr = Wallet.createRandom().address;
      const result = await sdk.addToWhitelist({
        keyVaultAddr: newWallet.keyVault,
        authProof: authProof,
        addressToAdd: newAddr
      });

      expect(result).toBeDefined();
      expect(result.transactionHash).toBeDefined();

      // Verify address was added
      const isWhitelisted = await sdk.isWhitelisted({
        keyVaultAddr: newWallet.keyVault,
        addressToCheck: newAddr
      });
      expect(isWhitelisted).toBe(true);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: keyVaultAddr,
        deadline: deadline
      });

      await expect(
        sdk.addToWhitelist({
          authProof: authProof,
          addressToAdd: testWalletAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authProof', async () => {
      await expect(
        sdk.addToWhitelist({
          keyVaultAddr: keyVaultAddr,
          addressToAdd: testWalletAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing addressToAdd', async () => {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: keyVaultAddr,
        deadline: deadline
      });

      await expect(
        sdk.addToWhitelist({
          keyVaultAddr: keyVaultAddr,
          authProof: authProof
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid authProof from non-whitelisted address', async () => {
      // Create wallet with wallet signature authenticator
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
      });

      // Create auth proof with non-whitelisted address
      const otherWallet = Wallet.createRandom();
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const invalidAuthProof = await sdk.createAuthProof({
        signer: otherWallet.connect(sdk.provider),
        keyVaultAddr: newWallet.keyVault,
        deadline: deadline
      });

      await expect(
        sdk.addToWhitelist({
          keyVaultAddr: newWallet.keyVault,
          authProof: invalidAuthProof,
          addressToAdd: Wallet.createRandom().address
        })
      ).rejects.toThrow();
    }, 30000);
  });

  describe('removeFromWhitelist', () => {
    test('should successfully remove address from whitelist', async () => {
      // Create wallet with wallet signature authenticator
      const initialWhitelist = [testWalletAddr, Wallet.createRandom().address];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [initialWhitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
      });

      // Create auth proof
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: newWallet.keyVault,
        deadline: deadline
      });

      // Remove address from whitelist
      const addrToRemove = initialWhitelist[1];
      const result = await sdk.removeFromWhitelist({
        keyVaultAddr: newWallet.keyVault,
        authProof: authProof,
        addressToRemove: addrToRemove
      });

      expect(result).toBeDefined();
      expect(result.transactionHash).toBeDefined();

      // Verify address was removed
      const isWhitelisted = await sdk.isWhitelisted({
        keyVaultAddr: newWallet.keyVault,
        addressToCheck: addrToRemove
      });
      expect(isWhitelisted).toBe(false);
    }, 30000);

    test('should fail with missing keyVaultAddr', async () => {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: keyVaultAddr,
        deadline: deadline
      });

      await expect(
        sdk.removeFromWhitelist({
          authProof: authProof,
          addressToRemove: testWalletAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing authProof', async () => {
      await expect(
        sdk.removeFromWhitelist({
          keyVaultAddr: keyVaultAddr,
          addressToRemove: testWalletAddr
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing addressToRemove', async () => {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: keyVaultAddr,
        deadline: deadline
      });

      await expect(
        sdk.removeFromWhitelist({
          keyVaultAddr: keyVaultAddr,
          authProof: authProof
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getDomainSeparator', () => {
    test('should return domain separator', async () => {
      const domainSeparator = await sdk.getDomainSeparator();

      expect(domainSeparator).toBeDefined();
      expect(typeof domainSeparator).toBe('string');
      expect(domainSeparator).toMatch(/^0x[a-fA-F0-9]{64}$/); // 32 bytes = 64 hex chars
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
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
      });

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: newWallet.keyVault,
        deadline: deadline
      });

      expect(authProof).toBeDefined();
      expect(typeof authProof).toBe('string');
      expect(authProof).toMatch(/^0x[a-fA-F0-9]+$/);

      // Verify auth proof is valid
      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        authProof: authProof
      });
      expect(isValid).toBe(true);
    }, 30000);

    test('should use default deadline if not provided', async () => {
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
      });

      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: newWallet.keyVault
        // deadline not provided, should default to 1 hour from now
      });

      expect(authProof).toBeDefined();
      
      // Verify auth proof is valid
      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        authProof: authProof
      });
      expect(isValid).toBe(true);
    }, 30000);

    test('should use default authenticatorAddr if not provided', async () => {
      const whitelist = [testWalletAddr];
      const authConfig = ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
      
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: authConfig
      });

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const authProof = await sdk.createAuthProof({
        signer: testWallet.connect(sdk.provider),
        keyVaultAddr: newWallet.keyVault,
        deadline: deadline
        // authenticatorAddr not provided, should use default
      });

      expect(authProof).toBeDefined();
      
      // Verify auth proof is valid
      const isValid = await sdk.isWalletSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        authProof: authProof
      });
      expect(isValid).toBe(true);
    }, 30000);

    test('should fail with missing signer', async () => {
      await expect(
        sdk.createAuthProof({
          keyVaultAddr: keyVaultAddr,
          deadline: Math.floor(Date.now() / 1000) + 3600
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with missing keyVaultAddr', async () => {
      await expect(
        sdk.createAuthProof({
          signer: testWallet.connect(sdk.provider),
          deadline: Math.floor(Date.now() / 1000) + 3600
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with deadline in the past', async () => {
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      await expect(
        sdk.createAuthProof({
          signer: testWallet.connect(sdk.provider),
          keyVaultAddr: keyVaultAddr,
          deadline: pastDeadline
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid keyVaultAddr', async () => {
      await expect(
        sdk.createAuthProof({
          signer: testWallet.connect(sdk.provider),
          keyVaultAddr: '0x123', // Too short
          deadline: Math.floor(Date.now() / 1000) + 3600
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should fail with invalid authenticatorAddr', async () => {
      await expect(
        sdk.createAuthProof({
          signer: testWallet.connect(sdk.provider),
          keyVaultAddr: keyVaultAddr,
          authenticatorAddr: '0x123', // Too short
          deadline: Math.floor(Date.now() / 1000) + 3600
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
