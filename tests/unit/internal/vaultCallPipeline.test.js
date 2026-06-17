/**
 * Unit tests for {@link VaultCallPipeline}.
 */

import { describe, test, expect } from '@jest/globals';
import { VaultCallPipeline } from '../../../src/internal/auth/session/VaultCallPipeline.js';
import { CredentialsRequiredError } from '../../../src/errors/index.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';

describe('VaultCallPipeline', () => {
  test('requireUserAccess throws without credentials session', () => {
    const pipeline = new VaultCallPipeline({
      credentialsSession: null,
      encodeAuthProof: { encode: async (o) => o }
    });

    expect(() => pipeline.requireUserAccess('test')).toThrow(CredentialsRequiredError);
  });

  test('resolveVaultOptions merges session keyVaultAddr', async () => {
    const pipeline = new VaultCallPipeline({
      credentialsSession: {
        applyToOptions: async (options) => ({
          ...options,
          keyVaultAddr: options.keyVaultAddr ?? VALID_TEST_ADDRESS
        })
      },
      encodeAuthProof: { encode: async (o) => o }
    });

    const resolved = await pipeline.resolveVaultOptions({}, { defaultIndex: true });
    expect(resolved.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
    expect(resolved.index).toBe(0);
  });

  test('resolveVaultOptions passes through explicit keyVaultAddr without credentials session', async () => {
    const pipeline = new VaultCallPipeline({
      credentialsSession: null,
      encodeAuthProof: { encode: async (o) => o }
    });

    const resolved = await pipeline.resolveVaultOptions(
      { keyVaultAddr: VALID_TEST_ADDRESS, index: 2 },
      { defaultIndex: true }
    );
    expect(resolved.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
    expect(resolved.index).toBe(2);
  });

  test('resolveVaultOptions throws without credentials or keyVaultAddr', async () => {
    const pipeline = new VaultCallPipeline({
      credentialsSession: null,
      encodeAuthProof: { encode: async (o) => o }
    });

    await expect(pipeline.resolveVaultOptions({})).rejects.toThrow(CredentialsRequiredError);
  });
});
