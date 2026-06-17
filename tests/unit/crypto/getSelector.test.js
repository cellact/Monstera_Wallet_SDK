import { describe, test, expect } from '@jest/globals';
import { getSelector } from '../../../src/internal/vault/getSelector.js';
import { DUAL_FACTOR_AUTHENTICATOR_ABI } from '../../../src/contracts/abi/authenticators/dualFactorAuthenticator.js';

describe('getSelector', () => {
  test('should resolve changePassword selector from ABI', () => {
    const selector = getSelector(DUAL_FACTOR_AUTHENTICATOR_ABI, 'changePassword');
    expect(selector).toBe('0x9ec5c7db');
  });

  test('should resolve changeGuardian selector from ABI', () => {
    const selector = getSelector(DUAL_FACTOR_AUTHENTICATOR_ABI, 'changeGuardian');
    expect(selector).toBe('0x9a38b85e');
  });

  test('should throw when function is missing from ABI', () => {
    expect(() => getSelector(DUAL_FACTOR_AUTHENTICATOR_ABI, 'missingFunction')).toThrow(
      'Function "missingFunction" not found in ABI'
    );
  });
});
