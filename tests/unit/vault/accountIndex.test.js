/**
 * Unit tests for {@link withDefaultAccountIndex}.
 */

import { describe, test, expect } from '@jest/globals';
import {
  DEFAULT_ACCOUNT_INDEX,
  withDefaultAccountIndex
} from '../../../src/internal/vault/accountIndex.js';

describe('withDefaultAccountIndex', () => {
  test('defaults missing index to 0', () => {
    expect(withDefaultAccountIndex({ keyVaultAddr: '0x' + '11'.repeat(20) })).toEqual({
      keyVaultAddr: '0x' + '11'.repeat(20),
      index: DEFAULT_ACCOUNT_INDEX
    });
  });

  test('preserves explicit index including 0', () => {
    expect(withDefaultAccountIndex({ index: 0 }).index).toBe(0);
    expect(withDefaultAccountIndex({ index: 3 }).index).toBe(3);
  });
});
