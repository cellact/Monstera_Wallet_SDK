/**
 * Unit tests for Monstera.connect.
 */

import { describe, test, expect } from '@jest/globals';
import { Wallet } from '../../../src/adapters/ethers/index.js';
import Monstera from '../../../src/sdk/Monstera.js';
import { getSdkInternals } from '../../../src/sdk/sdkInternals.js';
import { CredentialsRequiredError, WriteRequiresSignerError } from '../../../src/errors/index.js';
import { attachTestConnectSession } from '../../utils/credentials.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';

const TEST_SIGNER = Wallet.createRandom().privateKey;

describe('Monstera.connect', () => {
  test('connect with signer only', () => {
    const sdk = Monstera.connect({ mainnet: false, signer: TEST_SIGNER, checkVersion: false });
    expect(sdk.hasWriteAccess()).toBe(true);
    expect(sdk.hasCredentials()).toBe(false);
    expect(sdk._keyVaultAuthPipeline).toBeUndefined();
    expect(sdk._authConfigEncoder).toBeUndefined();
    expect(sdk._connectSession).toBeUndefined();
  });

  test('connect with credentials only', () => {
    const sdk = Monstera.connect({
      mainnet: false,
      checkVersion: false,
      credentials: { username: 'alice', password: 'secret' }
    });
    expect(sdk.hasCredentials()).toBe(true);
    expect(sdk.hasWriteAccess()).toBe(false);
  });

  test('connect with signer and credentials', () => {
    const sdk = Monstera.connect({
      mainnet: false,
      checkVersion: false,
      signer: TEST_SIGNER,
      credentials: { username: 'alice', password: 'secret' }
    });
    expect(sdk.hasWriteAccess()).toBe(true);
    expect(sdk.hasCredentials()).toBe(true);
  });

  test('connect readonly without signer or credentials', () => {
    const sdk = Monstera.connect({ mainnet: false, checkVersion: false });
    expect(sdk.hasWriteAccess()).toBe(false);
    expect(sdk.hasCredentials()).toBe(false);
  });

  test('signer-only connect allows vault ops with explicit keyVaultAddr', async () => {
    const sdk = Monstera.connect({
      mainnet: false,
      signer: TEST_SIGNER,
      checkVersion: false
    });

    const resolved = await getSdkInternals(sdk).keyVaultAuthPipeline.mergeVaultOptions({
      keyVaultAddr: VALID_TEST_ADDRESS
    });
    expect(resolved.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
    expect(resolved.index).toBeUndefined();
  });

  test('vault ops without credentials or keyVaultAddr throw', async () => {
    const sdk = Monstera.connect({
      mainnet: false,
      signer: TEST_SIGNER,
      checkVersion: false
    });

    await expect(
      sdk.signMessage({ message: '0x1234' })
    ).rejects.toThrow(CredentialsRequiredError);
  });

  test('credentials-only connect blocks wallet creation without signer', async () => {
    const sdk = Monstera.connect({
      mainnet: false,
      checkVersion: false,
      credentials: { username: 'alice', password: 'secret' }
    });

    await expect(
      sdk.createWallet({
        authConfig: { passwordHash: '0x' + '11'.repeat(32) }
      })
    ).rejects.toThrow(WriteRequiresSignerError);
  });

  test('signer connect with attached credentials session resolves vault options offline', async () => {
    const sdk = Monstera.connect({
      mainnet: false,
      signer: TEST_SIGNER,
      checkVersion: false
    });
    attachTestConnectSession(sdk);

    const resolved = await getSdkInternals(sdk).keyVaultAuthPipeline.mergeVaultOptions({});
    expect(resolved.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
    expect(resolved.index).toBeUndefined();
  });

  test('configurePassword resolves keyVaultAddr from credentials session', async () => {
    const sdk = Monstera.connect({
      mainnet: false,
      signer: TEST_SIGNER,
      checkVersion: false
    });
    attachTestConnectSession(sdk);

    const resolved = await getSdkInternals(sdk).keyVaultAuthPipeline.mergeVaultOptions({
      passwordHash: '0x' + '11'.repeat(32)
    });
    expect(resolved.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
  });
});
