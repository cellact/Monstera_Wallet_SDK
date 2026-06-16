/**
 * Unit tests for sign-authorization input resolution and {@link executeSignAuthorization}.
 */

import { describe, test, expect, jest } from '@jest/globals';
import { defaultAbiCoder } from '../../../src/adapters/ethers/encoding.js';
import {
  executeSignAuthorization,
  resolveSignAuthorizationInputs
} from '../../../src/internal/crypto/signAuthorization.js';
import { buildExecuteWithAuthAction } from '../../../src/internal/crypto/actions/keyVault.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';

describe('signAuthorization resolution', () => {
  const keyVaultAddr = VALID_TEST_ADDRESS;
  const delegateAddr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const authorityAddr = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

  function makeKeyVault(overrides = {}) {
    return {
      getAccountAddr: jest.fn().mockResolvedValue(authorityAddr),
      executeWithAuth: jest.fn(),
      ...overrides
    };
  }

  test('resolveSignAuthorizationInputs throws when chainId/nonce must be fetched but provider is missing', async () => {
    const deps = { keyVault: makeKeyVault(), fallbackProvider: null };
    await expect(
      resolveSignAuthorizationInputs(deps, {
        keyVaultAddr,
        delegateAddr
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      context: { parameter: 'provider' }
    });
  });

  test('resolveSignAuthorizationInputs prefers options.provider over fallbackProvider for network reads', async () => {
    const badFallback = {
      getNetwork: jest.fn(async () => {
        throw new Error('fallback should not be used');
      }),
      getTransactionCount: jest.fn()
    };
    const goodProvider = {
      getNetwork: jest.fn(async () => ({ chainId: 23295n })),
      getTransactionCount: jest.fn(async () => 3)
    };
    const deps = { keyVault: makeKeyVault(), fallbackProvider: badFallback };
    const out = await resolveSignAuthorizationInputs(deps, {
      keyVaultAddr,
      delegateAddr,
      provider: goodProvider
    });
    expect(out.chainId).toBe(23295n);
    expect(out.nonce).toBe(3n);
    expect(out.implCall).toMatch(/^0x[0-9a-f]+$/i);
    expect(goodProvider.getNetwork).toHaveBeenCalled();
    expect(badFallback.getNetwork).not.toHaveBeenCalled();
  });

  test('resolveSignAuthorizationInputs skips getNetwork when chainId is supplied', async () => {
    const fallbackProvider = {
      getNetwork: jest.fn(async () => ({ chainId: 1n })),
      getTransactionCount: jest.fn(async () => 0)
    };
    const deps = { keyVault: makeKeyVault(), fallbackProvider };
    await resolveSignAuthorizationInputs(deps, {
      keyVaultAddr,
      delegateAddr,
      chainId: 99n,
      nonce: 2n
    });
    expect(fallbackProvider.getNetwork).not.toHaveBeenCalled();
  });

  test('resolveSignAuthorizationInputs skips getTransactionCount when nonce is supplied', async () => {
    const fallbackProvider = {
      getNetwork: jest.fn(async () => ({ chainId: 1n })),
      getTransactionCount: jest.fn(async () => 0)
    };
    const deps = { keyVault: makeKeyVault(), fallbackProvider };
    await resolveSignAuthorizationInputs(deps, {
      keyVaultAddr,
      delegateAddr,
      chainId: 40n,
      nonce: 7n
    });
    expect(fallbackProvider.getTransactionCount).not.toHaveBeenCalled();
  });

  test('executeSignAuthorization encodes auth proof after implCall and calls executeWithAuth', async () => {
    const r = '0x' + '11'.repeat(32);
    const s = '0x' + '22'.repeat(32);
    const raw = defaultAbiCoder.encode(['bytes32', 'bytes32', 'uint8'], [r, s, 1]);
    const keyVault = makeKeyVault({
      executeWithAuth: jest.fn().mockResolvedValue(raw)
    });
    const fallbackProvider = {
      getNetwork: jest.fn(async () => ({ chainId: 10n })),
      getTransactionCount: jest.fn(async () => 0)
    };
    const encodeVaultAuthProof = jest.fn(async (opts) => ({
      ...opts,
      authProof: '0xdeadbeef'
    }));
    const result = await executeSignAuthorization(
      { keyVault, fallbackProvider, encodeVaultAuthProof },
      { keyVaultAddr, delegateAddr },
      buildExecuteWithAuthAction
    );
    expect(result.signature.r).toBe(r);
    expect(result.signature.s).toBe(s);
    expect(result.signature.yParity).toBe(1);
    expect(result.chainId).toBe(10n);
    expect(encodeVaultAuthProof).toHaveBeenCalled();
    expect(keyVault.executeWithAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        keyVaultAddr,
        authProof: '0xdeadbeef',
        implCall: expect.stringMatching(/^0x[0-9a-f]+$/i)
      })
    );
  });
});
