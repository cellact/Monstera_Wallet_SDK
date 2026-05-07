import { describe, test, expect } from '@jest/globals';
import { sanitizer } from '../../../src/internal/sanitization/index.js';

describe('sanitizer', () => {
  describe('forLog', () => {
    test('redacts sensitive key names to [redacted]', () => {
      const out = sanitizer.forLog({
        keyVaultAddr: '0x42f0c7932dA41a4f9063230145EEbD35f827179a',
        authProof: new Uint8Array([1, 2, 3]),
        implCall: new Uint8Array(4)
      });
      expect(out).toEqual({
        keyVaultAddr: '0x42f0c7932dA41a4f9063230145EEbD35f827179a',
        authProof: '[redacted]',
        implCall: '[redacted]'
      });
    });

    test('summarizes Uint8Array for non-sensitive keys', () => {
      const buf = new Uint8Array(32);
      const out = sanitizer.forLog({ keyVaultAddr: '0xabc', extra: buf });
      expect(out).toEqual({
        keyVaultAddr: '0xabc',
        extra: 'Uint8Array(32)'
      });
    });

    test('redacts sensitive keys in nested objects', () => {
      const out = sanitizer.forLog({
        meta: { password: 'x' }
      });
      expect(out).toEqual({
        meta: { password: '[redacted]' }
      });
    });

    test('respects maxDepth', () => {
      const deep = { a: { b: { c: 1 } } };
      const out = sanitizer.forLog(deep, 1);
      expect(out).toEqual({ a: { b: '[max depth]' } });
    });
  });

  describe('forErrorContext', () => {
    test('redacts nested mnemonic inside extraData', () => {
      const out = sanitizer.forErrorContext({
        client: 'WalletFactoryClient',
        extraData: {
          mnemonic: 'abandon abandon abandon'
        }
      });
      expect(out.client).toBe('WalletFactoryClient');
      expect(out.extraData.mnemonic).toMatchObject({
        redacted: true,
        valueKind: 'string',
        valueLength: 'abandon abandon abandon'.length
      });
    });

    test('still redacts top-level mnemonic', () => {
      const out = sanitizer.forErrorContext({
        mnemonic: 'word word word',
        methodName: 'create wallet'
      });
      expect(out.mnemonic).toEqual({
        redacted: true,
        valueKind: 'string',
        valueLength: 14
      });
    });
  });
});
