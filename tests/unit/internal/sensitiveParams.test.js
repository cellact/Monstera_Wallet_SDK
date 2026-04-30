import { describe, test, expect } from '@jest/globals';
import { sanitizeForLog } from '../../../src/internal/sensitiveParams.js';

describe('sensitiveParams', () => {
  describe('sanitizeForLog', () => {
    test('redacts sensitive key names to [redacted]', () => {
      const out = sanitizeForLog({
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
      const out = sanitizeForLog({ keyVaultAddr: '0xabc', extra: buf });
      expect(out).toEqual({
        keyVaultAddr: '0xabc',
        extra: 'Uint8Array(32)'
      });
    });

    test('redacts sensitive keys in nested objects', () => {
      const out = sanitizeForLog({
        meta: { password: 'x' }
      });
      expect(out).toEqual({
        meta: { password: '[redacted]' }
      });
    });

    test('respects maxDepth', () => {
      const deep = { a: { b: { c: 1 } } };
      const out = sanitizeForLog(deep, { maxDepth: 1 });
      expect(out).toEqual({ a: { b: '[max depth]' } });
    });
  });
});
