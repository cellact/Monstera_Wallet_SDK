/**
 * Unit tests for {@link AuthConfigEncoder#encode}.
 */

import { describe, test, expect } from '@jest/globals';
import { keccak256, toUtf8Bytes } from '../../../src/adapters/ethers/hashing.js';
import { AuthConfigEncoder } from '../../../src/internal/auth/encoding/AuthConfigEncoder.js';
import { buildNetworkConfig } from '../../../src/config/networks.js';
import { VALID_TEST_ADDRESS } from '../../utils/fixtures.js';
import { ValidationError } from '../../../src/errors/index.js';
import {
  createDualFactorAuthConfig,
  createWalletSigAuthConfig
} from '../../../src/internal/auth/encoding/authConfigBytes.js';

describe('AuthConfigEncoder.encode', () => {
  const network = buildNetworkConfig({ network: 'testnet' });
  const builder = new AuthConfigEncoder({ addresses: network.addresses });
  const passwordHash = keccak256(toUtf8Bytes('offline-auth-config'));

  test('hex string authConfig passes through unchanged', () => {
    const hex = '0xdeadbeef';
    const opts = {
      authenticatorAddr: network.addresses.passwordAuth,
      authConfig: hex,
      extra: 1
    };
    const out = builder.encode(opts);
    expect(out).toEqual(opts);
    expect(out.authConfig).toBe(hex);
  });

  test('structured PasswordAuth encodes to bytes32 hash', () => {
    const out = builder.encode({
      authenticatorAddr: network.addresses.passwordAuth,
      authConfig: { passwordHash }
    });
    expect(out.authConfig).toBe(passwordHash);
    expect(out.authenticatorAddr).toBe(network.addresses.passwordAuth);
  });

  test('structured WalletSignatureAuth encodes whitelist', () => {
    const whitelist = [VALID_TEST_ADDRESS];
    const out = builder.encode({
      authenticatorAddr: network.addresses.walletSignatureAuth,
      authConfig: { initialWhitelist: whitelist }
    });
    expect(out.authConfig).toBe(createWalletSigAuthConfig(whitelist));
  });

  test('structured DualFactor encodes (hash, address)', () => {
    const out = builder.encode({
      authenticatorAddr: network.addresses.dualFactorAuth,
      authConfig: { passwordHash, guardianAddr: VALID_TEST_ADDRESS }
    });
    expect(out.authConfig).toBe(
      createDualFactorAuthConfig(passwordHash, VALID_TEST_ADDRESS)
    );
  });

  test('defaults authenticator to passwordAuth when omitted for structured config', () => {
    const out = builder.encode({
      authConfig: { passwordHash }
    });
    expect(out.authenticatorAddr).toBe(network.addresses.passwordAuth);
    expect(out.authConfig).toBe(passwordHash);
  });

  test('unknown built-in authenticatorAddr throws ValidationError', () => {
    const unknown = '0x1111111111111111111111111111111111111111';
    expect(() =>
      builder.encode({
        authenticatorAddr: unknown,
        authConfig: { passwordHash }
      })
    ).toThrow(ValidationError);
    try {
      builder.encode({
        authenticatorAddr: unknown,
        authConfig: { passwordHash }
      });
    } catch (e) {
      expect(e.context.parameter).toBe('authenticatorAddr');
    }
  });

  test('null authConfig throws ValidationError', () => {
    expect(() =>
      builder.encode({
        authenticatorAddr: network.addresses.passwordAuth,
        authConfig: null
      })
    ).toThrow(ValidationError);
    try {
      builder.encode({
        authenticatorAddr: network.addresses.passwordAuth,
        authConfig: null
      });
    } catch (e) {
      expect(e.context.parameter).toBe('authConfig');
    }
  });

  test('array authConfig throws ValidationError', () => {
    expect(() =>
      builder.encode({
        authenticatorAddr: network.addresses.passwordAuth,
        authConfig: [{ passwordHash }]
      })
    ).toThrow(ValidationError);
    try {
      builder.encode({
        authenticatorAddr: network.addresses.passwordAuth,
        authConfig: [{ passwordHash }]
      });
    } catch (e) {
      expect(e.context.parameter).toBe('authConfig');
    }
  });
});
