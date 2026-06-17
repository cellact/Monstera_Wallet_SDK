/**
 * Unit tests for Monstera connect profiles (admin / user / full / readonly).
 */

import { describe, test, expect } from '@jest/globals';
import { Wallet } from '../../../src/adapters/ethers/index.js';
import Monstera from '../../../src/sdk/Monstera.js';
import { ValidationError, CredentialsRequiredError, WriteRequiresSignerError } from '../../../src/errors/index.js';
import { attachTestCredentialsSession } from '../../utils/credentials.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';

const TEST_SIGNER = Wallet.createRandom().privateKey;

describe('Monstera connect profiles', () => {
  test('connectAdmin requires signer and rejects credentials', () => {
    expect(() =>
      Monstera.connectAdmin({ mainnet: false, checkVersion: false })
    ).toThrow(ValidationError);

    expect(() =>
      Monstera.connectAdmin({
        mainnet: false,
        checkVersion: false,
        signer: TEST_SIGNER,
        credentials: { username: 'alice', password: 'secret' }
      })
    ).toThrow(ValidationError);
  });

  test('connectUser requires credentials and rejects signer', () => {
    expect(() =>
      Monstera.connectUser({ mainnet: false, checkVersion: false })
    ).toThrow(ValidationError);

    expect(() =>
      Monstera.connectUser({
        mainnet: false,
        checkVersion: false,
        credentials: { username: 'alice', password: 'secret' },
        signer: TEST_SIGNER
      })
    ).toThrow(ValidationError);
  });

  test('connectFull requires signer and credentials', () => {
    expect(() =>
      Monstera.connectFull({
        mainnet: false,
        checkVersion: false,
        signer: TEST_SIGNER
      })
    ).toThrow(ValidationError);
  });

  test('connect routes by options', () => {
    const admin = Monstera.connect({ mainnet: false, signer: TEST_SIGNER, checkVersion: false });
    expect(admin.getConnectProfile()).toBe('admin');
    expect(admin.hasAdminAccess()).toBe(true);
    expect(admin.hasWriteAccess()).toBe(true);
    expect(admin.hasCredentials()).toBe(false);

    const user = Monstera.connect({
      mainnet: false,
      checkVersion: false,
      credentials: { username: 'alice', password: 'secret' }
    });
    expect(user.getConnectProfile()).toBe('user');
    expect(user.hasCredentials()).toBe(true);
    expect(user.hasAdminAccess()).toBe(false);

    const full = Monstera.connect({
      mainnet: false,
      checkVersion: false,
      signer: TEST_SIGNER,
      credentials: { username: 'alice', password: 'secret' }
    });
    expect(full.getConnectProfile()).toBe('full');
    expect(full.hasAdminAccess()).toBe(true);
    expect(full.hasCredentials()).toBe(true);

    const readonly = Monstera.connect({ mainnet: false, checkVersion: false });
    expect(readonly.getConnectProfile()).toBe('readonly');
  });

  test('admin instance blocks vault signing without credentials', async () => {
    const sdk = Monstera.connectAdmin({
      mainnet: false,
      signer: TEST_SIGNER,
      checkVersion: false
    });

    await expect(
      sdk.signMessage({ keyVaultAddr: VALID_TEST_ADDRESS, message: '0x1234' })
    ).rejects.toThrow(CredentialsRequiredError);
  });

  test('user instance blocks wallet creation without signer', async () => {
    const sdk = Monstera.connectUser({
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

  test('admin with attached credentials session can resolve vault options offline', async () => {
    const sdk = Monstera.connectAdmin({
      mainnet: false,
      signer: TEST_SIGNER,
      checkVersion: false
    });
    attachTestCredentialsSession(sdk);

    const resolved = await sdk._vaultPipeline.resolveVaultOptions({}, { defaultIndex: true });
    expect(resolved.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
    expect(resolved.index).toBe(0);
  });
});
