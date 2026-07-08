import { describe, test, expect } from '@jest/globals';
import { resolveChildAddr } from '../../../src/internal/auth/authenticators/resolveChild.js';
import { DEFAULT_ADDRESSES } from '../../../src/config/networks.js';

const addresses = DEFAULT_ADDRESSES.testnet;

describe('resolveChildAddr', () => {
  test('prefers viaChildFlowId over contract child target', () => {
    const addr = resolveChildAddr(
      {
        viaChildFlowId: 'password',
        child: addresses.apiKeySessionAuth
      },
      addresses
    );

    expect(addr.toLowerCase()).toBe(addresses.passwordAuth.toLowerCase());
  });

  test('uses childFlowId for vault sign routing', () => {
    const addr = resolveChildAddr(
      {
        childFlowId: 'apiKeySession'
      },
      addresses
    );

    expect(addr.toLowerCase()).toBe(addresses.apiKeySessionAuth.toLowerCase());
  });

  test('falls back to child address when no flow id is set', () => {
    const addr = resolveChildAddr(
      {
        child: addresses.passwordMinuteSignatureAuth
      },
      addresses
    );

    expect(addr.toLowerCase()).toBe(addresses.passwordMinuteSignatureAuth.toLowerCase());
  });

  test('returns a checksummed address, not undefined', () => {
    const addr = resolveChildAddr({ childFlowId: 'password' }, addresses);
    expect(typeof addr).toBe('string');
    expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
