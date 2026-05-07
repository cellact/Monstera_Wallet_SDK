/**
 * Unit tests for {@link AuthProofBuilder.prototype.encode} branches (pass-through vs structured encoding).
 */

import { describe, test, expect } from '@jest/globals';
import { AuthProofBuilder } from '../../../src/internal/auth/proof/AuthProofBuilder.js';
import { buildNetworkConfig } from '../../../src/config/networks.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';
import { toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { ValidationError } from '../../../src/errors/index.js';

describe('AuthProofBuilder.encode', () => {
  const network = buildNetworkConfig({ network: 'testnet' });

  /** @returns {import('../../../src/types/index.js').AuthProofContext} */
  function makeCtx(getAuthenticatorAddr) {
    return {
      addresses: network.addresses,
      chainId: network.chainId,
      readProvider: /** @type {import('../../../src/types/index.js').EthersAbstractProvider} */ ({}),
      getAuthenticatorAddr
    };
  }

  test('returns options unchanged when authProof is a hex string (pass-through)', async () => {
    const builder = new AuthProofBuilder(
      makeCtx(async () => network.addresses.passwordAuth)
    );
    const hex = '0xabcd';
    const opts = { keyVaultAddr: VALID_TEST_ADDRESS, authProof: hex, foo: 1 };
    const out = await builder.encode(opts);
    expect(out).toBe(opts);
    expect(out.authProof).toBe(hex);
  });

  test('returns options unchanged when authProof is Uint8Array (pass-through)', async () => {
    const builder = new AuthProofBuilder(makeCtx(async () => network.addresses.passwordAuth));
    const bytes = new Uint8Array([1, 2, 3]);
    const opts = { keyVaultAddr: VALID_TEST_ADDRESS, authProof: bytes };
    const out = await builder.encode(opts);
    expect(out).toBe(opts);
  });

  test('returns options unchanged when authProof is missing / empty (pass-through)', async () => {
    const builder = new AuthProofBuilder(makeCtx(async () => network.addresses.passwordAuth));
    const opts = { keyVaultAddr: VALID_TEST_ADDRESS };
    const out = await builder.encode(opts);
    expect(out).toBe(opts);
  });

  test('throws for array authProof', async () => {
    const builder = new AuthProofBuilder(makeCtx(async () => network.addresses.passwordAuth));
    await expect(
      builder.encode({
        keyVaultAddr: VALID_TEST_ADDRESS,
        authProof: [{ password: toUtf8Bytes('x') }]
      })
    ).rejects.toThrow(ValidationError);
  });

  test('encodes structured password authProof via registry', async () => {
    const builder = new AuthProofBuilder(
      makeCtx(async () => network.addresses.passwordAuth)
    );
    const password = toUtf8Bytes('unit-test-password');
    const out = await builder.encode({
      keyVaultAddr: VALID_TEST_ADDRESS,
      authProof: { password }
    });
    expect(typeof out.authProof).toBe('string');
    expect(out.authProof).toMatch(/^0x[0-9a-f]+$/i);
    expect(out.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
  });

  test('throws when no built-in encoder for authenticator (opaque hex required)', async () => {
    const unknownAuth = '0x1111111111111111111111111111111111111111';
    const builder = new AuthProofBuilder(makeCtx(async () => unknownAuth));
    await expect(
      builder.encode({
        keyVaultAddr: VALID_TEST_ADDRESS,
        authProof: { password: toUtf8Bytes('x') }
      })
    ).rejects.toThrow(/No built-in encoder/i);
  });
});
