/**
 * Unit tests for {@link KeyVaultAuthPipeline}.
 */

import { describe, test, expect } from '@jest/globals';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { ValidationError, CredentialsRequiredError } from '../../../src/errors/index.js';
import { KeyVaultAuthPipeline } from '../../../src/internal/auth/pipelines/KeyVaultAuthPipeline.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';

const PASSWORD_BYTES = toUtf8Bytes('pw');
const PASSWORD_HASH = keccak256(PASSWORD_BYTES);

function createMockAuthProofEncoder() {
  return {
    encodeForKeyVault: async (resolved, session, buildAction) => {
      const action = buildAction(resolved);
      return {
        ...resolved,
        authProof: {
          password: session?.getPasswordBytes(),
          passwordHash: session?.getPasswordHash(),
          action
        }
      };
    }
  };
}

function createMockSession() {
  return {
    mergeSessionDefaults: async (options) => ({
      ...options,
      keyVaultAddr: options.keyVaultAddr ?? VALID_TEST_ADDRESS
    }),
    getPasswordBytes: () => PASSWORD_BYTES,
    getPasswordHash: () => PASSWORD_HASH
  };
}

describe('KeyVaultAuthPipeline', () => {
  test('requireUserAccess throws without credentials session', () => {
    const pipeline = new KeyVaultAuthPipeline({
      credentialsSession: null,
      authProofEncoder: { encodeForKeyVault: async (o) => o }
    });

    expect(() => pipeline.requireUserAccess('test')).toThrow(CredentialsRequiredError);
  });

  test('mergeVaultOptions merges session keyVaultAddr', async () => {
    const pipeline = new KeyVaultAuthPipeline({
      credentialsSession: {
        mergeSessionDefaults: async (options) => ({
          ...options,
          keyVaultAddr: options.keyVaultAddr ?? VALID_TEST_ADDRESS
        })
      },
      authProofEncoder: { encodeForKeyVault: async (o) => o }
    });

    const resolved = await pipeline.mergeVaultOptions({});
    expect(resolved.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
    expect(resolved.index).toBeUndefined();
  });

  test('mergeVaultOptions passes through explicit keyVaultAddr without credentials session', async () => {
    const pipeline = new KeyVaultAuthPipeline({
      credentialsSession: null,
      authProofEncoder: { encodeForKeyVault: async (o) => o }
    });

    const resolved = await pipeline.mergeVaultOptions({
      keyVaultAddr: VALID_TEST_ADDRESS,
      index: 2
    });
    expect(resolved.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
    expect(resolved.index).toBe(2);
  });

  test('mergeVaultOptions throws without credentials or keyVaultAddr', async () => {
    const pipeline = new KeyVaultAuthPipeline({
      credentialsSession: null,
      authProofEncoder: { encodeForKeyVault: async (o) => o }
    });

    await expect(pipeline.mergeVaultOptions({})).rejects.toThrow(CredentialsRequiredError);
  });

  test('encodeAuthProof delegates to auth proof encoder', async () => {
    const pipeline = new KeyVaultAuthPipeline({
      credentialsSession: createMockSession(),
      authProofEncoder: createMockAuthProofEncoder()
    });

    const encoded = await pipeline.encodeAuthProof({}, () => ({
      selector: '0x12345678',
      paramsHash: '0x' + '11'.repeat(32)
    }));

    expect(encoded.authProof).toEqual({
      password: PASSWORD_BYTES,
      passwordHash: PASSWORD_HASH,
      action: {
        selector: '0x12345678',
        paramsHash: '0x' + '11'.repeat(32)
      }
    });
    expect(encoded.index).toBe(0);
  });

  test('encodeAuthProof preserves explicit index', async () => {
    const pipeline = new KeyVaultAuthPipeline({
      credentialsSession: createMockSession(),
      authProofEncoder: createMockAuthProofEncoder()
    });

    const encoded = await pipeline.encodeAuthProof({ index: 3 }, () => ({
      selector: '0x12345678',
      paramsHash: '0x' + '11'.repeat(32)
    }));

    expect(encoded.index).toBe(3);
  });
});
