/**
 * Unit tests for username/password credentials session.
 */

import { describe, test, expect, jest } from '@jest/globals';
import { ZeroAddress } from '../../../src/adapters/ethers/addresses.js';
import { toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { ValidationError } from '../../../src/errors/index.js';
import {
  CredentialsSession
} from '../../../src/internal/auth/session/CredentialsSession.js';
import { parseConnectCredentials } from '../../../src/internal/validators/connectOptions.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';

const WALLET_ADDR = VALID_TEST_ADDRESS;
const KEY_VAULT_ADDR = '0x1111111111111111111111111111111111111111';
const USERNAME_HASH = '0x' + 'ab'.repeat(32);

function createDeps(overrides = {}) {
  return {
    hashUsername: jest.fn(async () => USERNAME_HASH),
    walletOfUsername: jest.fn(async () => WALLET_ADDR),
    getKeyVaultAddr: jest.fn(async () => KEY_VAULT_ADDR),
    ...overrides
  };
}

describe('parseConnectCredentials', () => {
  test('returns null when credentials omitted', () => {
    expect(parseConnectCredentials(undefined)).toBeNull();
    expect(parseConnectCredentials(null)).toBeNull();
  });

  test('accepts username and password', () => {
    expect(parseConnectCredentials({ username: 'alice', password: 'secret' })).toEqual({
      username: 'alice',
      password: 'secret'
    });
  });

  test('rejects partial credentials', () => {
    expect(() => parseConnectCredentials({ username: 'alice' })).toThrow(ValidationError);
    expect(() => parseConnectCredentials({ password: 'secret' })).toThrow(ValidationError);
  });

  test('rejects empty username or password', () => {
    expect(() => parseConnectCredentials({ username: '  ', password: 'x' })).toThrow(ValidationError);
    expect(() => parseConnectCredentials({ username: 'alice', password: '' })).toThrow(ValidationError);
  });
});

describe('CredentialsSession', () => {
  test('resolves wallet and keyVault once, then caches', async () => {
    const deps = createDeps();
    const session = new CredentialsSession({ username: 'alice', password: 'pw' }, deps);

    await expect(session.getKeyVaultAddr()).resolves.toBe(KEY_VAULT_ADDR);
    await expect(session.getWalletAddr()).resolves.toBe(WALLET_ADDR);

    expect(deps.hashUsername).toHaveBeenCalledTimes(1);
    expect(deps.walletOfUsername).toHaveBeenCalledTimes(1);
    expect(deps.getKeyVaultAddr).toHaveBeenCalledTimes(1);
    expect(deps.getKeyVaultAddr).toHaveBeenCalledWith({ walletAddr: WALLET_ADDR });
  });

  test('applyToOptions injects keyVaultAddr and default authProof', async () => {
    const session = new CredentialsSession({ username: 'alice', password: 'pw' }, createDeps());

    const resolved = await session.applyToOptions({}, { requireAuthProof: true });

    expect(resolved.keyVaultAddr).toBe(KEY_VAULT_ADDR);
    expect(resolved.authProof).toEqual({ password: toUtf8Bytes('pw') });
  });

  test('applyToOptions injects currentPassword when requested', async () => {
    const session = new CredentialsSession({ username: 'alice', password: 'pw' }, createDeps());

    const resolved = await session.applyToOptions({}, { defaultCurrentPassword: true });

    expect(resolved.currentPassword).toEqual(toUtf8Bytes('pw'));
  });

  test('does not override explicit keyVaultAddr', async () => {
    const explicit = '0x2222222222222222222222222222222222222222';
    const deps = createDeps();
    const session = new CredentialsSession({ username: 'alice', password: 'pw' }, deps);

    const resolved = await session.applyToOptions({ keyVaultAddr: explicit });

    expect(resolved.keyVaultAddr).toBe(explicit);
    expect(deps.hashUsername).not.toHaveBeenCalled();
  });

  test('throws when username is not registered', async () => {
    const deps = createDeps({
      walletOfUsername: jest.fn(async () => ZeroAddress)
    });
    const session = new CredentialsSession({ username: 'missing', password: 'pw' }, deps);

    await expect(session.getKeyVaultAddr()).rejects.toThrow(ValidationError);
    await expect(session.getKeyVaultAddr()).rejects.toThrow(/No wallet is registered/);
  });
});
