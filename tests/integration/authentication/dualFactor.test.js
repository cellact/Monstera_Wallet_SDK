/**
 * Integration tests for dual-factor (password + guardian) authenticator.
 */

import 'dotenv/config';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Wallet } from '../../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { registerSdkTeardown } from '../../utils/teardown.js';
import { loadAuthenticationFixtures } from './shared.js';
import { expectTransactionResult, expectValidTxHash, expectValidHex } from '../../utils/assertions.js';
import {
  buildDualFactorChangePasswordAction,
  buildChangeGuardianAction
} from '../../../src/internal/auth/actions/index.js';
import { buildAuthContext } from '../../../src/internal/auth/actionContext.js';
import { createTestVaultSignAction } from '../../utils/fixtures.js';

describe('Authentication — dual factor', () => {
  let sdk;
  let password;
  let passwordHash;
  let testWallet;
  let testWalletAddr;

  beforeAll(async () => {
    ({
      sdk,
      password,
      passwordHash,
      testWallet,
      testWalletAddr
    } = await loadAuthenticationFixtures());
  }, 30000);

  registerSdkTeardown(afterAll, () => sdk);

  describe('isDualFactorConfigured', () => {
    test('should return true when wallet is created with dual-factor authenticator', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.dualFactorAuth,
        authConfig: { passwordHash, guardianAddr: testWalletAddr }
      });

      expect(await sdk.isDualFactorConfigured({ keyVaultAddr: newWallet.keyVault })).toBe(true);
    }, 30000);
  });

  describe('getGuardian', () => {
    test('should return guardian address from dual-factor wallet creation', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.dualFactorAuth,
        authConfig: { passwordHash, guardianAddr: testWalletAddr }
      });

      const guardian = await sdk.getGuardian({ keyVaultAddr: newWallet.keyVault });
      expect(guardian.toLowerCase()).toBe(testWalletAddr.toLowerCase());
    }, 30000);
  });

  describe('configureDualFactor', () => {
    test('should switch an existing vault to dual-factor auth', async () => {
      const whitelist = [testWalletAddr];
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.walletSignatureAuth,
        authConfig: { initialWhitelist: whitelist }
      });

      expect(await sdk.isDualFactorConfigured({ keyVaultAddr: newWallet.keyVault })).toBe(false);

      const result = await sdk.configureDualFactor({
        keyVaultAddr: newWallet.keyVault,
        passwordHash,
        guardianAddr: testWalletAddr
      });

      expectTransactionResult(result);
      expect(await sdk.isDualFactorConfigured({ keyVaultAddr: newWallet.keyVault })).toBe(true);
      expect((await sdk.getGuardian({ keyVaultAddr: newWallet.keyVault })).toLowerCase()).toBe(
        testWalletAddr.toLowerCase()
      );
    }, 30000);
  });

  describe('getDomainSeparatorDualFactor', () => {
    test('should return a bytes32 hex string', async () => {
      const sep = await sdk.getDomainSeparatorDualFactor();
      expect(typeof sep).toBe('string');
      expectValidTxHash(sep);
    });
  });

  describe('isPasswordDualFactorValid', () => {
    test('should return true for correct password hash and guardian signer', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.dualFactorAuth,
        authConfig: { passwordHash, guardianAddr: testWalletAddr }
      });

      const ok = await sdk.isPasswordDualFactorValid({
        keyVaultAddr: newWallet.keyVault,
        passwordHash,
        signer: testWallet.connect(sdk.provider),
        action: createTestVaultSignAction()
      });
      expect(ok).toBe(true);
    }, 30000);

    test('should return false when guardian signer is wrong', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.dualFactorAuth,
        authConfig: { passwordHash, guardianAddr: testWalletAddr }
      });

      const wrongSigner = Wallet.createRandom().connect(sdk.provider);
      const ok = await sdk.isPasswordDualFactorValid({
        keyVaultAddr: newWallet.keyVault,
        passwordHash,
        signer: wrongSigner,
        action: createTestVaultSignAction()
      });
      expect(ok).toBe(false);
    }, 30000);
  });

  describe('updatePasswordDualFactor', () => {
    test('should rotate password hash while preserving guardian', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.dualFactorAuth,
        authConfig: { passwordHash, guardianAddr: testWalletAddr }
      });

      const nextPassword = 'dualfactor-rotated-99';
      const nextHash = keccak256(toUtf8Bytes(nextPassword));

      const updateResult = await sdk.updatePasswordDualFactor({
        keyVaultAddr: newWallet.keyVault,
        passwordHash,
        signer: testWallet.connect(sdk.provider),
        newPasswordHash: nextHash
      });

      expectTransactionResult(updateResult);

      const okNew = await sdk.isPasswordDualFactorValid({
        keyVaultAddr: newWallet.keyVault,
        passwordHash: nextHash,
        signer: testWallet.connect(sdk.provider),
        action: buildDualFactorChangePasswordAction(sdk.addresses.dualFactorAuth, nextHash)
      });
      expect(okNew).toBe(true);

      const okOld = await sdk.isPasswordDualFactorValid({
        keyVaultAddr: newWallet.keyVault,
        passwordHash,
        signer: testWallet.connect(sdk.provider),
        action: buildDualFactorChangePasswordAction(sdk.addresses.dualFactorAuth, nextHash)
      });
      expect(okOld).toBe(false);

      await sdk.updatePasswordDualFactor({
        keyVaultAddr: newWallet.keyVault,
        passwordHash: nextHash,
        signer: testWallet.connect(sdk.provider),
        newPasswordHash: passwordHash
      });
    }, 60000);
  });

  describe('updateGuardian', () => {
    test('should update the guardian address', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.dualFactorAuth,
        authConfig: { passwordHash, guardianAddr: testWalletAddr }
      });

      const nextGuardian = Wallet.createRandom();

      const updateResult = await sdk.updateGuardian({
        keyVaultAddr: newWallet.keyVault,
        passwordHash,
        signer: testWallet.connect(sdk.provider),
        newGuardian: nextGuardian.address
      });

      expectTransactionResult(updateResult);

      expect((await sdk.getGuardian({ keyVaultAddr: newWallet.keyVault })).toLowerCase()).toBe(
        nextGuardian.address.toLowerCase()
      );

      const okNext = await sdk.isPasswordDualFactorValid({
        keyVaultAddr: newWallet.keyVault,
        passwordHash,
        signer: nextGuardian.connect(sdk.provider),
        action: buildChangeGuardianAction(sdk.addresses.dualFactorAuth, nextGuardian.address)
      });
      expect(okNext).toBe(true);

      await sdk.updateGuardian({
        keyVaultAddr: newWallet.keyVault,
        passwordHash,
        signer: nextGuardian.connect(sdk.provider),
        newGuardian: testWalletAddr
      });
    }, 60000);
  });

  describe('createAuthProofDualFactor', () => {
    test('should return ABI-encoded hex auth proof accepted by dualFactor.verify', async () => {
      const newWallet = await sdk.createWallet({
        authenticatorAddr: sdk.addresses.dualFactorAuth,
        authConfig: { passwordHash, guardianAddr: testWalletAddr }
      });

      const action = createTestVaultSignAction();

      const authProof = await sdk.createAuthProofDualFactor({
        keyVaultAddr: newWallet.keyVault,
        passwordHash,
        signer: testWallet.connect(sdk.provider),
        action
      });

      expectValidHex(authProof);

      const actionHash = await sdk.keyVault.computeActionHash({
        keyVaultAddr: newWallet.keyVault,
        selector: action.selector,
        paramsHash: action.paramsHash
      });
      const authContext = buildAuthContext({
        target: newWallet.keyVault,
        selector: action.selector,
        paramsHash: action.paramsHash,
        actionHash
      });

      const ok = await sdk.auth.dualFactor.verify({
        keyVaultAddr: newWallet.keyVault,
        authProof,
        action: authContext
      });
      expect(ok).toBe(true);
    }, 30000);
  });
});
