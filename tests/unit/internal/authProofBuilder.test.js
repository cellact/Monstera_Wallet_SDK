/**
 * Unit tests for {@link AuthProofEncoder.prototype.encode} branches.
 */

import { describe, test, expect } from '@jest/globals';
import { Wallet } from '../../../src/adapters/ethers/index.js';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { createTestVaultSignAction } from '../../utils/fixtures.js';
import { AuthProofEncoder } from '../../../src/internal/auth/proof/AuthProofEncoder.js';
import { buildNetworkConfig } from '../../../src/config/networks.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';
import { ValidationError, NetworkError } from '../../../src/errors/index.js';
import { nowUnixTimestampSeconds } from '../../../src/internal/utils/time.js';

describe('AuthProofEncoder.encode', () => {
  const network = buildNetworkConfig({ network: 'testnet' });

  /**
   * @param {(keyVaultAddr: string) => Promise<string>} getAuthenticatorAddr
   */
  function makePipeline(getAuthenticatorAddr) {
    return new AuthProofEncoder({
      config: network,
      readProvider: /** @type {import('../../../src/types/index.js').EthersAbstractProvider} */ ({}),
      getAuthenticatorAddr
    });
  }

  test('returns options unchanged when authProof is a hex string (pass-through)', async () => {
    const pipeline = makePipeline(async () => network.addresses.passwordAuth);
    const hex = '0xabcd';
    const opts = { keyVaultAddr: VALID_TEST_ADDRESS, authProof: hex, foo: 1 };
    const out = await pipeline.encode(opts);
    expect(out).toBe(opts);
    expect(out.authProof).toBe(hex);
  });

  test('returns options unchanged when authProof is Uint8Array (pass-through)', async () => {
    const pipeline = makePipeline(async () => network.addresses.passwordAuth);
    const bytes = new Uint8Array([1, 2, 3]);
    const opts = { keyVaultAddr: VALID_TEST_ADDRESS, authProof: bytes };
    const out = await pipeline.encode(opts);
    expect(out).toBe(opts);
  });

  test('returns options unchanged when authProof is missing / empty (pass-through)', async () => {
    const pipeline = makePipeline(async () => network.addresses.passwordAuth);
    const opts = { keyVaultAddr: VALID_TEST_ADDRESS };
    const out = await pipeline.encode(opts);
    expect(out).toBe(opts);
  });

  test('throws for array authProof', async () => {
    const pipeline = makePipeline(async () => network.addresses.passwordAuth);
    await expect(
      pipeline.encode({
        keyVaultAddr: VALID_TEST_ADDRESS,
        authProof: [{ password: toUtf8Bytes('x') }]
      })
    ).rejects.toThrow(ValidationError);
  });

  test('encodes structured password authProof via registry', async () => {
    const actionHash = keccak256(toUtf8Bytes('password-unit-action-hash'));
    const pipeline = new AuthProofEncoder({
      config: network,
      readProvider: {
        call: async () => actionHash
      },
      getAuthenticatorAddr: async () => network.addresses.passwordAuth
    });
    const password = toUtf8Bytes('unit-test-password');
    const out = await pipeline.encode({
      keyVaultAddr: VALID_TEST_ADDRESS,
      authProof: { password, action: createTestVaultSignAction() }
    });
    expect(typeof out.authProof).toBe('string');
    expect(out.authProof).toMatch(/^0x[0-9a-f]+$/i);
    expect(out.keyVaultAddr).toBe(VALID_TEST_ADDRESS);
  });

  test('throws when no built-in encoder for authenticator (opaque hex required)', async () => {
    const unknownAuth = '0x1111111111111111111111111111111111111111';
    const pipeline = makePipeline(async () => unknownAuth);
    await expect(
      pipeline.encode({
        keyVaultAddr: VALID_TEST_ADDRESS,
        authProof: { password: toUtf8Bytes('x') }
      })
    ).rejects.toThrow(/No built-in encoder/i);
  });

  test('forwards error when getAuthenticatorAddr rejects (e.g. network failure)', async () => {
    const pipeline = makePipeline(async () => {
      throw new NetworkError('simulated RPC failure', null, null);
    });
    await expect(
      pipeline.encode({
        keyVaultAddr: VALID_TEST_ADDRESS,
        authProof: { password: toUtf8Bytes('x') }
      })
    ).rejects.toThrow(NetworkError);
  });

  test('encodes structured WalletSignature authProof via walletSignature encoder', async () => {
    const actionHash = keccak256(toUtf8Bytes('wallet-signature-unit-action-hash'));
    const signer = Wallet.createRandom();
    const deadline = nowUnixTimestampSeconds() + 7200;
    const pipeline = new AuthProofEncoder({
      config: network,
      readProvider: {
        call: async () => actionHash
      },
      getAuthenticatorAddr: async () => network.addresses.walletSignatureAuth
    });
    const out = await pipeline.encode({
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
    const pipeline = new AuthProofEncoder({
      config: network,
      readProvider,
      getAuthenticatorAddr: async () => network.addresses.dualFactorAuth
    });
    const out = await pipeline.encode({
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

describe('AuthProofEncoder.encodeForKeyVault', () => {
  const network = buildNetworkConfig({ network: 'testnet' });
  const actionHash = keccak256(toUtf8Bytes('vault-call-session-action-hash'));

  function mockSession() {
    return {
      getPasswordBytes: () => toUtf8Bytes('session-password'),
      getPasswordHash: () => keccak256(toUtf8Bytes('session-password'))
    };
  }

  function makePipeline() {
    return new AuthProofEncoder({
      config: network,
      readProvider: {
        call: async () => actionHash
      },
      getAuthenticatorAddr: async () => network.addresses.passwordAuth
    });
  }

  test('encodes proof from session when authProof is omitted', async () => {
    const pipeline = makePipeline();
    const out = await pipeline.encodeForKeyVault(
      { keyVaultAddr: VALID_TEST_ADDRESS, index: 0, message: toUtf8Bytes('hello') },
      mockSession(),
      () => createTestVaultSignAction()
    );

    expect(typeof out.authProof).toBe('string');
    expect(out.authProof).toMatch(/^0x[0-9a-f]+$/i);
  });

  test('passes through pre-encoded authProof unchanged', async () => {
    const pipeline = makePipeline();
    const hex = '0xabcd';
    const opts = { keyVaultAddr: VALID_TEST_ADDRESS, authProof: hex };
    const out = await pipeline.encodeForKeyVault(opts, mockSession(), () => createTestVaultSignAction());
    expect(out).toBe(opts);
    expect(out.authProof).toBe(hex);
  });

  test('uses explicit authProof fields over session defaults', async () => {
    const pipeline = makePipeline();
    const customPassword = toUtf8Bytes('explicit-password');
    const out = await pipeline.encodeForKeyVault(
      {
        keyVaultAddr: VALID_TEST_ADDRESS,
        authProof: { password: customPassword },
        index: 0,
        message: toUtf8Bytes('hello')
      },
      mockSession(),
      () => createTestVaultSignAction()
    );

    expect(typeof out.authProof).toBe('string');
    expect(out.authProof).toMatch(/^0x[0-9a-f]+$/i);
  });

  test('encodes minute-signature proof from session when authProof is omitted', async () => {
    const pipeline = new AuthProofEncoder({
      config: network,
      readProvider: {
        call: async () => actionHash,
        getBlock: async () => ({ timestamp: Math.floor(Date.now() / 1000) })
      },
      getAuthenticatorAddr: async () => network.addresses.passwordMinuteSignatureAuth
    });

    const out = await pipeline.encodeForKeyVault(
      { keyVaultAddr: VALID_TEST_ADDRESS, index: 0, message: toUtf8Bytes('hello') },
      mockSession(),
      () => createTestVaultSignAction()
    );

    expect(typeof out.authProof).toBe('string');
    expect(out.authProof).toMatch(/^0x[0-9a-f]+$/i);
  });

  test('minute-signature uses explicit authProof.password instead of session passwordHash', async () => {
    const pipeline = new AuthProofEncoder({
      config: network,
      readProvider: {
        call: async () => actionHash,
        getBlock: async () => ({ timestamp: Math.floor(Date.now() / 1000) })
      },
      getAuthenticatorAddr: async () => network.addresses.passwordMinuteSignatureAuth
    });

    const fromSession = await pipeline.encodeForKeyVault(
      { keyVaultAddr: VALID_TEST_ADDRESS, index: 0, message: toUtf8Bytes('hello') },
      mockSession(),
      () => createTestVaultSignAction()
    );
    const fromWrongPassword = await pipeline.encodeForKeyVault(
      {
        keyVaultAddr: VALID_TEST_ADDRESS,
        authProof: { password: toUtf8Bytes('wrongpassword') }, // could also use authProof: { passwordHash: keccak256(toUtf8Bytes('wrongpassword')) } as SDK will derive the passwordHash from the password
        index: 0,
        message: toUtf8Bytes('hello')
      },
      mockSession(),
      () => createTestVaultSignAction()
    );

    expect(fromWrongPassword.authProof).not.toBe(fromSession.authProof);
  });

  test('throws when authProof omitted and no session can supply input', async () => {
    const pipeline = makePipeline();
    await expect(
      pipeline.encodeForKeyVault(
        { keyVaultAddr: VALID_TEST_ADDRESS, index: 0, message: toUtf8Bytes('hello') },
        null,
        () => createTestVaultSignAction()
      )
    ).rejects.toThrow(/authProof\.password is required/);
  });
});
