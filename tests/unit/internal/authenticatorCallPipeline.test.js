/**
 * Unit tests for {@link ExplicitAuthPipeline}.
 */

import { describe, test, expect } from '@jest/globals';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { ExplicitAuthPipeline } from '../../../src/internal/auth/pipelines/ExplicitAuthPipeline.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';

const PASSWORD_BYTES = toUtf8Bytes('pw');
const PASSWORD_HASH = keccak256(PASSWORD_BYTES);
const NEW_PASSWORD_HASH = keccak256(toUtf8Bytes('new-pw'));
const AUTHENTICATOR_ADDR = '0x' + 'aa'.repeat(20);

function createMockAuthProofEncoder() {
  return {
    resolveByFlowId: (flowId) => ({
      authenticatorAddr: AUTHENTICATOR_ADDR,
      spec: {
        flowId,
        mapSessionResolved: (resolved, authenticatorAddr) => ({
          keyVaultAddr: resolved.keyVaultAddr,
          authenticatorAddr,
          password: resolved.currentPassword ?? resolved.password
        })
      }
    }),
    encodeForFlow: async (flowId, options) => ({
      authProof: `proof:${flowId}:${options.password ? 'password' : 'other'}`
    })
  };
}

function createMockSession() {
  return {
    mergeSessionDefaults: async (options) => ({
      ...options,
      keyVaultAddr: options.keyVaultAddr ?? VALID_TEST_ADDRESS,
      currentPassword: options.currentPassword ?? PASSWORD_BYTES
    }),
    getPasswordBytes: () => PASSWORD_BYTES,
    getPasswordHash: () => PASSWORD_HASH
  };
}

describe('ExplicitAuthPipeline', () => {
  test('encodeAuthProof resolves flow and prepares proof without buildAction', async () => {
    const pipeline = new ExplicitAuthPipeline({
      connectSession: createMockSession(),
      authProofEncoder: createMockAuthProofEncoder()
    });

    const encoded = await pipeline.encodeAuthProof(
      'password',
      { newPasswordHash: NEW_PASSWORD_HASH },
      { flags: { defaultCurrentPassword: true } }
    );

    expect(encoded.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
    expect(encoded.authProof).toBe('proof:password:password');
    expect(encoded.authenticatorAddr).toBe(AUTHENTICATOR_ADDR);
  });

  test('invokeWithAuthProof delegates to encodeAuthProof then invokes client', async () => {
    const pipeline = new ExplicitAuthPipeline({
      connectSession: createMockSession(),
      authProofEncoder: createMockAuthProofEncoder()
    });

    const result = await pipeline.invokeWithAuthProof(
      'password',
      { newPasswordHash: NEW_PASSWORD_HASH },
      {
        flags: { defaultCurrentPassword: true },
        buildAction: (resolved, authenticatorAddr) => ({
          target: authenticatorAddr,
          selector: '0x12345678',
          paramsHash: '0x' + '11'.repeat(32)
        }),
        invoke: async ({ keyVaultAddr, authProof, newPasswordHash }) => ({
          keyVaultAddr,
          currentPassword: authProof,
          newPasswordHash
        })
      }
    );

    expect(result.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
    expect(result.currentPassword).toBe('proof:password:password');
    expect(result.newPasswordHash).toBe(NEW_PASSWORD_HASH);
  });

  test('encodeAuthProof preserves caller-supplied authenticatorAddr', async () => {
    const callerAddr = '0x' + 'cc'.repeat(20);
    let encodeOptions;

    const pipeline = new ExplicitAuthPipeline({
      connectSession: createMockSession(),
      authProofEncoder: {
        resolveByFlowId: (flowId) => ({
          authenticatorAddr: AUTHENTICATOR_ADDR,
          spec: {
            flowId,
            mapSessionResolved: (resolved, authenticatorAddr) => ({
              keyVaultAddr: resolved.keyVaultAddr,
              authenticatorAddr
            })
          }
        }),
        encodeForFlow: async (_flowId, options) => {
          encodeOptions = options;
          return { authProof: 'proof' };
        }
      }
    });

    await pipeline.encodeAuthProof('walletSignature', {
      authenticatorAddr: callerAddr,
      signer: {}
    });

    expect(encodeOptions.authenticatorAddr).toBe(callerAddr);
  });

  test('invokeWithAuthProof honors authenticatorAddr override', async () => {
    const overrideAddr = '0x' + 'bb'.repeat(20);
    let capturedTarget;

    const pipeline = new ExplicitAuthPipeline({
      connectSession: createMockSession(),
      authProofEncoder: createMockAuthProofEncoder()
    });

    await pipeline.invokeWithAuthProof(
      'password',
      { newPasswordHash: NEW_PASSWORD_HASH },
      {
        flags: { defaultCurrentPassword: true },
        buildAction: (_resolved, authenticatorAddr) => {
          capturedTarget = authenticatorAddr;
          return {
            target: authenticatorAddr,
            selector: '0x12345678',
            paramsHash: '0x' + '11'.repeat(32)
          };
        },
        invoke: async () => ({}),
        overrides: { authenticatorAddr: overrideAddr }
      }
    );

    expect(capturedTarget).toBe(overrideAddr);
  });
});
