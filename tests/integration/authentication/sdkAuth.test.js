/**
 * Integration tests for SDK authenticator registry helpers.
 */

import 'dotenv/config';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { ValidationError } from '../../../src/errors/index.js';
import { registerSdkTeardown } from '../../utils/teardown.js';
import { loadAuthenticationFixtures } from './shared.js';

describe('Authentication — SDK registry', () => {
  let sdk;

  beforeAll(async () => {
    ({ sdk } = await loadAuthenticationFixtures());
  }, 30000);

  registerSdkTeardown(afterAll, () => sdk);

  test('getAvailableAuthTypes lists built-in authenticator keys', () => {
    const types = sdk.getAvailableAuthTypes();

    expect(types).toEqual(
      expect.arrayContaining([
        'walletSignature',
        'password',
        'dualFactor',
        'passwordMinuteSignature'
      ])
    );

    expect(types).not.toContain('readProvider');
    expect(types).not.toContain('writeSigner');
    expect(types).not.toContain('config');
  });

  test('getAuthClient returns authenticator modules', () => {
    expect(typeof sdk.getAuthClient('walletSignature').isConfigured).toBe('function');
    expect(typeof sdk.getAuthClient('password').isConfigured).toBe('function');
    expect(typeof sdk.getAuthClient('dualFactor').isConfigured).toBe('function');
    expect(typeof sdk.getAuthClient('passwordMinuteSignature').isConfigured).toBe('function');
  });

  test('getAuthClient throws for unknown authenticator key', () => {
    expect(() => sdk.getAuthClient('doesNotExist')).toThrow(ValidationError);
  });

  test('getAuthClient rejects internal instance keys', () => {
    expect(() => sdk.getAuthClient('readProvider')).toThrow(ValidationError);
    expect(() => sdk.getAuthClient('writeSigner')).toThrow(ValidationError);
    expect(() => sdk.getAuthClient('config')).toThrow(ValidationError);
  });
});
