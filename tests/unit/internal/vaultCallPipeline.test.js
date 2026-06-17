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

function createMockEncodeAuthProof(authenticatorId = 'passwordAuth') {
  return {
    encode: async (options) => options,
    resolveBuiltinAuthenticator: async () => ({
      authenticatorAddr: VALID_TEST_ADDRESS,
      encoder: { id: authenticatorId }
    })
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

  test('encodeAuthProof injects password authProof for password authenticator', async () => {
    const pipeline = new VaultCallPipeline({
      credentialsSession: createMockSession(),
      encodeAuthProof: createMockEncodeAuthProof('passwordAuth')
    });

    const encoded = await pipeline.encodeAuthProof({}, () => ({
      selector: '0x12345678',
      paramsHash: '0x' + '11'.repeat(32)
    }));

    expect(encoded.authProof).toEqual({
      password: PASSWORD_BYTES,
      action: {
        selector: '0x12345678',
        paramsHash: '0x' + '11'.repeat(32)
      }
    });
  });

  test('encodeAuthProof injects passwordHash for minute-signature authenticator', async () => {
    const pipeline = new VaultCallPipeline({
      credentialsSession: createMockSession(),
      encodeAuthProof: createMockEncodeAuthProof('passwordMinuteSignatureAuth')
    });

    const encoded = await pipeline.encodeAuthProof({}, () => ({
      selector: '0x12345678',
      paramsHash: '0x' + '11'.repeat(32)
    }));

    expect(encoded.authProof.passwordHash).toBe(PASSWORD_HASH);
  });

  test('encodeAuthProof requires signer for wallet-signature authenticator', async () => {
    const pipeline = new VaultCallPipeline({
      credentialsSession: createMockSession(),
      encodeAuthProof: createMockEncodeAuthProof('walletSignatureAuth')
    });

    await expect(
      pipeline.encodeAuthProof({}, () => ({
        selector: '0x12345678',
        paramsHash: '0x' + '11'.repeat(32)
      }))
    ).rejects.toThrow(ValidationError);
  });
});
