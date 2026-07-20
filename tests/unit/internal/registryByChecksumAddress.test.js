/**
 * Unit tests for {@link createRegistryByChecksumAddress}.
 */

import { describe, test, expect } from '@jest/globals';
import { createRegistryByChecksumAddress } from '../../../src/internal/auth/specs/registry.js';
import { buildNetworkConfig } from '../../../src/config/networks.js';
import { ValidationError } from '../../../src/errors/index.js';

describe('createRegistryByChecksumAddress', () => {
  const { addresses } = buildNetworkConfig({ network: 'testnet' });
  const encoderA = { id: 'a' };
  const encoderB = { id: 'b' };

  const registry = createRegistryByChecksumAddress([
    { address: addresses.passwordAuth, encoder: encoderA },
    { address: addresses.walletSignatureAuth, encoder: encoderB }
  ]);

  test('lookup succeeds for same address with different casing', () => {
    const lower = addresses.passwordAuth.toLowerCase();
    expect(registry.getByAuthenticatorAddr(lower)).toBe(encoderA);
    expect(registry.getByAuthenticatorAddr(addresses.passwordAuth)).toBe(encoderA);
  });

  test('lookup returns undefined for unknown authenticator (no throw)', () => {
    expect(
      registry.getByAuthenticatorAddr('0x2222222222222222222222222222222222222222')
    ).toBeUndefined();
  });

  test('lookup throws ValidationError for malformed address', () => {
    expect(() => registry.getByAuthenticatorAddr('not-an-address')).toThrow(ValidationError);
  });
});
