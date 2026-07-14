/**
 * Unit tests for username/password credentials session.
 */

import { describe, test, expect, jest } from '@jest/globals';
import { ZeroAddress } from '../../../src/adapters/ethers/addresses.js';
import { toUtf8Bytes, keccak256 } from '../../../src/adapters/ethers/hashing.js';
import { ValidationError, CredentialsRequiredError } from '../../../src/errors/index.js';
import {
  ConnectSession
} from '../../../src/internal/auth/session/ConnectSession.js';
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

  test('normalises username to trim and lowercase', () => {
    expect(parseConnectCredentials({ username: '  Alice  ', password: 'secret' })).toEqual({
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

  test('accepts username and apiKey', () => {
    const apiKey = '0x' + 'ab'.repeat(32);
    expect(parseConnectCredentials({ username: 'alice', apiKey })).toEqual({
      username: 'alice',
      apiKey
    });
  });

  test('rejects username without password or apiKey', () => {
    expect(() => parseConnectCredentials({ username: 'alice' })).toThrow(ValidationError);
  });
});

describe('ConnectSession', () => {
  test('resolves wallet and keyVault once, then caches', async () => {
    const deps = createDeps();
    const session = new ConnectSession({ username: 'alice', password: 'pw' }, deps);

    await expect(session.getKeyVaultAddr()).resolves.toBe(KEY_VAULT_ADDR);
    await expect(session.getWalletAddr()).resolves.toBe(WALLET_ADDR);

    expect(deps.hashUsername).toHaveBeenCalledWith({ username: 'alice' });
    expect(deps.hashUsername).toHaveBeenCalledTimes(1);
    expect(deps.walletOfUsername).toHaveBeenCalledTimes(1);
    expect(deps.getKeyVaultAddr).toHaveBeenCalledTimes(1);
    expect(deps.getKeyVaultAddr).toHaveBeenCalledWith({ walletAddr: WALLET_ADDR });
  });

  test('normalises mixed-case username before hashing', async () => {
    const deps = createDeps();
    const session = new ConnectSession({ username: '  Alice  ', password: 'pw' }, deps);

    await session.getKeyVaultAddr();

    expect(deps.hashUsername).toHaveBeenCalledWith({ username: 'alice' });
  });

  test('mergeSessionDefaults injects keyVaultAddr only', async () => {
    const session = new ConnectSession({ username: 'alice', password: 'pw' }, createDeps());

    const resolved = await session.mergeSessionDefaults({});

    expect(resolved.keyVaultAddr).toBe(KEY_VAULT_ADDR);
    expect(resolved.authProof).toBeUndefined();
  });

  test('getPasswordHash returns keccak256 of session password bytes', () => {
    const session = new ConnectSession({ username: 'alice', password: 'pw' }, createDeps());

    expect(session.getPasswordHash()).toBe(keccak256(toUtf8Bytes('pw')));
  });

  test('getApiKeySecret returns keccak256 of session apiKey', () => {
    const apiKey = '0x' + 'cd'.repeat(32);
    const session = new ConnectSession({ username: 'alice', apiKey }, createDeps());

    expect(session.getApiKeySecret()).toBe(keccak256(apiKey));
  });

  test('mergeSessionDefaults injects apiKeySecret when requested', async () => {
    const apiKey = '0x' + 'cd'.repeat(32);
    const session = new ConnectSession({ username: 'alice', apiKey }, createDeps());

    const resolved = await session.mergeSessionDefaults({}, { defaultApiKeySecret: true });

    expect(resolved.apiKeySecret).toBe(keccak256(apiKey));
  });

  test('mergeSessionDefaults injects currentPassword when requested', async () => {
    const session = new ConnectSession({ username: 'alice', password: 'pw' }, createDeps());

    const resolved = await session.mergeSessionDefaults({}, { defaultCurrentPassword: true });

    expect(resolved.currentPassword).toEqual(toUtf8Bytes('pw'));
  });

  test('does not override explicit keyVaultAddr', async () => {
    const explicit = '0x2222222222222222222222222222222222222222';
    const deps = createDeps();
    const session = new ConnectSession({ username: 'alice', password: 'pw' }, deps);

    const resolved = await session.mergeSessionDefaults({ keyVaultAddr: explicit });

    expect(resolved.keyVaultAddr).toBe(explicit);
    expect(deps.hashUsername).not.toHaveBeenCalled();
  });

  test('throws when username is not registered', async () => {
    const deps = createDeps({
      walletOfUsername: jest.fn(async () => ZeroAddress)
    });
    const session = new ConnectSession({ username: 'missing', password: 'pw' }, deps);

    await expect(session.getKeyVaultAddr()).rejects.toThrow(ValidationError);
    await expect(session.getKeyVaultAddr()).rejects.toThrow(/No wallet is registered/);
  });

  describe('mergeVaultOptions', () => {
    test('merges session keyVaultAddr without injecting index', async () => {
      const session = new ConnectSession({ username: 'alice', password: 'pw' }, createDeps());

      const resolved = await ConnectSession.mergeVaultOptions(session, {});

      expect(resolved.keyVaultAddr).toBe(KEY_VAULT_ADDR);
      expect(resolved.index).toBeUndefined();
    });

    test('passes through explicit keyVaultAddr without session', async () => {
      const resolved = await ConnectSession.mergeVaultOptions(null, {
        keyVaultAddr: WALLET_ADDR,
        index: 2
      });

      expect(resolved.keyVaultAddr).toBe(WALLET_ADDR);
      expect(resolved.index).toBe(2);
    });

    test('throws without session or keyVaultAddr', async () => {
      await expect(ConnectSession.mergeVaultOptions(null, {})).rejects.toThrow(
        CredentialsRequiredError
      );
    });
  });
});
