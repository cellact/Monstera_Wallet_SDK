/**
 * Integration tests for password-minute-signature authenticator.
 */

import 'dotenv/config';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { registerSdkTeardown } from '../../utils/teardown.js';
import { loadAuthenticationFixtures } from './shared.js';
import { createPasswordAuthProof } from '../../utils/fixtures.js';
import { expectTransactionResult, expectValidHex } from '../../utils/assertions.js';

describe('Authentication — password minute signature', () => {
  let sdk;
  let password;
  let passwordHash;
  let testWalletAddr;

  beforeAll(async () => {
    ({
      sdk,
      password,
      passwordHash,
      testWalletAddr
    } = await loadAuthenticationFixtures());
  }, 30000);

  registerSdkTeardown(afterAll, () => sdk);

  describe('isPasswordMinuteSignatureConfigured', () => {
    test('should return true when wallet is created with minute authenticator', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordMinuteSignatureAuth,
        authConfig: { passwordHash }
      });

      expect(
        await sdk.isPasswordMinuteSignatureConfigured({ keyVaultAddr: newWallet.keyVault })
      ).toBe(true);
    }, 30000);

    test('should return false for wallet-signature-only vault before configurePasswordMinuteSignature', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      expect(
        await sdk.isPasswordMinuteSignatureConfigured({ keyVaultAddr: newWallet.keyVault })
      ).toBe(false);
    }, 30000);
  });

  describe('configurePasswordMinuteSignature', () => {
    test('should configure minute auth on an existing vault', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      expect(
        await sdk.isPasswordMinuteSignatureConfigured({ keyVaultAddr: newWallet.keyVault })
      ).toBe(false);

      const result = await sdk.configurePasswordMinuteSignature({
        keyVaultAddr: newWallet.keyVault,
        passwordHash
      });

      expectTransactionResult(result);

      expect(
        await sdk.isPasswordMinuteSignatureConfigured({ keyVaultAddr: newWallet.keyVault })
      ).toBe(true);
    }, 30000);
  });

  describe('isPasswordMinuteSignatureValid', () => {
    test('should return true when password hash matches derived minute-bucket signer', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordMinuteSignatureAuth,
        authConfig: { passwordHash }
      });

      const ok = await sdk.isPasswordMinuteSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        passwordHash
      });
      expect(ok).toBe(true);
    }, 30000);

    test('should return false for wrong password hash', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordMinuteSignatureAuth,
        authConfig: { passwordHash }
      });

      const wrongHash = keccak256(toUtf8Bytes('not-the-password'));

      const ok = await sdk.isPasswordMinuteSignatureValid({
        keyVaultAddr: newWallet.keyVault,
        passwordHash: wrongHash
      });
      expect(ok).toBe(false);
    }, 30000);
  });

  describe('updatePasswordMinuteSignature', () => {
    test('should rotate stored password hash', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordMinuteSignatureAuth,
        authConfig: { passwordHash }
      });

      const nextPassword = 'minute-rotated-42';
      const nextHash = keccak256(toUtf8Bytes(nextPassword));

      const updateResult = await sdk.updatePasswordMinuteSignature({
        keyVaultAddr: newWallet.keyVault,
        currentPassword: createPasswordAuthProof(password),
        newPasswordHash: nextHash
      });

      expectTransactionResult(updateResult);

      expect(
        await sdk.isPasswordMinuteSignatureValid({
          keyVaultAddr: newWallet.keyVault,
          passwordHash: nextHash
        })
      ).toBe(true);

      expect(
        await sdk.isPasswordMinuteSignatureValid({
          keyVaultAddr: newWallet.keyVault,
          passwordHash
        })
      ).toBe(false);

      await sdk.updatePasswordMinuteSignature({
        keyVaultAddr: newWallet.keyVault,
        currentPassword: createPasswordAuthProof(nextPassword),
        newPasswordHash: passwordHash
      });
    }, 60000);
  });

  describe('createAuthProofMinuteSignature', () => {
    test('should return ABI-encoded proof, minute bucket, and derived address accepted by verify', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.passwordMinuteSignatureAuth,
        authConfig: { passwordHash }
      });

      const proofData = await sdk.createAuthProofMinuteSignature({
        keyVaultAddr: newWallet.keyVault,
        passwordHash
      });

      expectValidHex(proofData.authProof);
      expect(typeof proofData.minuteBucket).toBe('number');
      expect(proofData.derivedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

      const ok = await sdk.auth.passwordMinuteSignature.verify({
        keyVaultAddr: newWallet.keyVault,
        authProof: proofData.authProof
      });
      expect(ok).toBe(true);
    }, 30000);
  });
});
