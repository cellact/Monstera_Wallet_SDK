/**
 * Integration tests for password authenticator flows.
 */

import 'dotenv/config';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { registerSdkTeardown } from '../../utils/teardown.js';
import { loadAuthenticationFixtures } from './shared.js';
import { createPasswordAuthProof } from '../../utils/fixtures.js';
import { expectTransactionResult } from '../../utils/assertions.js';

describe('Authentication — password', () => {
  let sdk;
  let password;
  let passwordHash;
  let keyVaultAddr;
  let testWalletAddr;

  beforeAll(async () => {
    ({
      sdk,
      password,
      passwordHash,
      keyVaultAddr,
      testWalletAddr
    } = await loadAuthenticationFixtures());
  }, 30000);

  registerSdkTeardown(afterAll, () => sdk);

  describe('configurePassword', () => {
    test('should successfully configure password for a wallet', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      const isConfiguredBefore = await sdk.isPasswordConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfiguredBefore).toBe(false);

      const result = await sdk.configurePassword({
        keyVaultAddr: newWallet.keyVault,
        passwordHash: passwordHash
      });

      expectTransactionResult(result);

      const isConfigured = await sdk.isPasswordConfigured({
        keyVaultAddr: newWallet.keyVault
      });
      expect(isConfigured).toBe(true);
    }, 30000);
  });

  describe('updatePassword', () => {
    test('should successfully update password', async () => {
      const newPassword = 'newpassword123';
      const newPasswordHash = keccak256(toUtf8Bytes(newPassword));
      const currentPasswordBytes = createPasswordAuthProof(password);

      const result = await sdk.updatePassword({
        keyVaultAddr,
        currentPassword: currentPasswordBytes,
        newPasswordHash
      });

      expectTransactionResult(result);

      const isValid = await sdk.isPasswordValid({
        keyVaultAddr,
        currentPassword: createPasswordAuthProof(newPassword)
      });
      expect(isValid).toBe(true);

      const isOldValid = await sdk.isPasswordValid({
        keyVaultAddr,
        currentPassword: currentPasswordBytes
      });
      expect(isOldValid).toBe(false);

      await sdk.updatePassword({
        keyVaultAddr,
        currentPassword: createPasswordAuthProof(newPassword),
        newPasswordHash: passwordHash
      });
    }, 30000);

    test('should fail with wrong current password', async () => {
      const wrongPassword = createPasswordAuthProof('wrongpassword');
      const newPasswordHash = keccak256(toUtf8Bytes('newpassword'));

      await expect(
        sdk.updatePassword({
          keyVaultAddr,
          currentPassword: wrongPassword,
          newPasswordHash
        })
      ).rejects.toThrow();
    }, 30000);
  });

  describe('isPasswordConfigured', () => {
    test('should return true for configured wallet', async () => {
      const isConfigured = await sdk.isPasswordConfigured({
        keyVaultAddr
      });
      expect(isConfigured).toBe(true);
    });

    test('should return false for unconfigured wallet', async () => {
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
  });
});
