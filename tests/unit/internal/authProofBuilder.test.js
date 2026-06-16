/**
 * Unit tests for {@link AuthProofBuilder.prototype.encode} branches (pass-through vs structured encoding).
 */

import { describe, test, expect } from '@jest/globals';
import { Wallet } from '../../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { createTestVaultSignAction } from '../../utils/fixtures.js';
import { AuthProofBuilder } from '../../../src/internal/auth/proof/AuthProofBuilder.js';
import { buildNetworkConfig } from '../../../src/config/networks.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';
import { ValidationError, NetworkError } from '../../../src/errors/index.js';
import { nowUnixTimestampSeconds } from '../../../src/internal/utils/time.js';

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
    const actionHash = keccak256(toUtf8Bytes('password-unit-action-hash'));
    const builder = new AuthProofBuilder({
      addresses: network.addresses,
      chainId: network.chainId,
      readProvider: {
        call: async () => actionHash
      },
      getAuthenticatorAddr: async () => network.addresses.passwordAuth
    });
    const password = toUtf8Bytes('unit-test-password');
    const out = await builder.encode({
      keyVaultAddr: VALID_TEST_ADDRESS,
      authProof: { password, action: createTestVaultSignAction() }
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

  test('forwards error when getAuthenticatorAddr rejects (e.g. network failure)', async () => {
    const builder = new AuthProofBuilder(
      makeCtx(async () => {
        throw new NetworkError('simulated RPC failure', null, null);
      })
    );
    await expect(
      builder.encode({
        keyVaultAddr: VALID_TEST_ADDRESS,
        authProof: { password: toUtf8Bytes('x') }
      })
    ).rejects.toThrow(NetworkError);
  });

  test('encodes structured WalletSignature authProof via walletSignature encoder', async () => {
    const actionHash = keccak256(toUtf8Bytes('wallet-signature-unit-action-hash'));
    const signer = Wallet.createRandom();
    const deadline = nowUnixTimestampSeconds() + 7200;
    const builder = new AuthProofBuilder({
      addresses: network.addresses,
      chainId: network.chainId,
      readProvider: {
        call: async () => actionHash
      },
      getAuthenticatorAddr: async () => network.addresses.walletSignatureAuth
    });
    const out = await builder.encode({
      keyVaultAddr: VALID_TEST_ADDRESS,
      authProof: { signer, deadline, action: createTestVaultSignAction() }
    });
    expect(typeof out.authProof).toBe('string');
    expect(out.authProof).toMatch(/^0x[0-9a-f]+$/i);
  });

  test('encodes structured DualFactor authProof via dualFactor encoder', async () => {
    const passwordHash = keccak256(toUtf8Bytes('dual-factor-unit'));
    const guardian = Wallet.createRandom();
    const deadline = nowUnixTimestampSeconds() + 7200;
    const actionHash = keccak256(toUtf8Bytes('dual-factor-unit-action-hash'));
    const readProvider = {
      getBlock: async () => ({ timestamp: Math.floor(Date.now() / 1000) }),
      call: async () => actionHash
    };
    const builder = new AuthProofBuilder({
      addresses: network.addresses,
      chainId: network.chainId,
      readProvider,
      getAuthenticatorAddr: async () => network.addresses.dualFactorAuth
    });
    const out = await builder.encode({
      keyVaultAddr: VALID_TEST_ADDRESS,
      authProof: {
        passwordHash,
        signer: guardian,
        deadline,
        action: createTestVaultSignAction()
      }
    });
    expect(typeof out.authProof).toBe('string');
    expect(out.authProof).toMatch(/^0x[0-9a-f]+$/i);
  });
});
