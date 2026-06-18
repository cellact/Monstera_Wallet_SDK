/**
 * Unit tests for {@link VaultCallPipeline}.
 */

import { describe, test, expect } from '@jest/globals';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { ValidationError, CredentialsRequiredError } from '../../../src/errors/index.js';
import { VaultCallPipeline } from '../../../src/internal/auth/session/VaultCallPipeline.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';

const PASSWORD_BYTES = toUtf8Bytes('pw');
const PASSWORD_HASH = keccak256(PASSWORD_BYTES);

function createMockAuthProofPipeline() {
  return {
    encodeVaultCall: async (resolved, session, buildAction) => {
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
    applyToOptions: async (options) => ({
      ...options,
      keyVaultAddr: options.keyVaultAddr ?? VALID_TEST_ADDRESS
    }),
    getPasswordBytes: () => PASSWORD_BYTES,
    getPasswordHash: () => PASSWORD_HASH
  };
}

describe('VaultCallPipeline', () => {
  test('requireUserAccess throws without credentials session', () => {
    const pipeline = new VaultCallPipeline({
      credentialsSession: null,
      authProofPipeline: { encodeVaultCall: async (o) => o }
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
      authProofPipeline: { encodeVaultCall: async (o) => o }
    });

    const resolved = await pipeline.resolveVaultOptions({});
    expect(resolved.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
    expect(resolved.index).toBeUndefined();
  });

  test('resolveVaultOptions passes through explicit keyVaultAddr without credentials session', async () => {
    const pipeline = new VaultCallPipeline({
      credentialsSession: null,
      authProofPipeline: { encodeVaultCall: async (o) => o }
    });

    const resolved = await pipeline.resolveVaultOptions({
      keyVaultAddr: VALID_TEST_ADDRESS,
      index: 2
    });
    expect(resolved.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
    expect(resolved.index).toBe(2);
  });

  test('resolveVaultOptions throws without credentials or keyVaultAddr', async () => {
    const pipeline = new VaultCallPipeline({
      credentialsSession: null,
      authProofPipeline: { encodeVaultCall: async (o) => o }
    });

    await expect(pipeline.resolveVaultOptions({})).rejects.toThrow(CredentialsRequiredError);
  });

  test('encodeAuthProof delegates to auth proof pipeline', async () => {
    const pipeline = new VaultCallPipeline({
      credentialsSession: createMockSession(),
      authProofPipeline: createMockAuthProofPipeline()
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
    const pipeline = new VaultCallPipeline({
      credentialsSession: createMockSession(),
      authProofPipeline: createMockAuthProofPipeline()
    });

    const encoded = await pipeline.encodeAuthProof({ index: 3 }, () => ({
      selector: '0x12345678',
      paramsHash: '0x' + '11'.repeat(32)
    }));

    expect(encoded.index).toBe(3);
  });
});
