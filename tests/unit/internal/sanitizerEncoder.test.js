/**
 * Unit tests for {@link Sanitizer#forEncoderValue}.
 */

import { describe, test, expect } from '@jest/globals';
import { Sanitizer } from '../../../src/internal/sanitization/Sanitizer.js';
import { SENSITIVE_PARAM_NAMES } from '../../../src/internal/sanitization/SensitiveParams.js';

describe('Sanitizer.forEncoderValue', () => {
  const sanitizer = new Sanitizer(SENSITIVE_PARAM_NAMES);

  test('redacts value when arg label matches a sensitive parameter name', () => {
    const out = sanitizer.forEncoderValue('password', 'super-secret');
    expect(out).toEqual({
      redacted: true,
      valueKind: 'string',
      valueLength: 12
    });
  });

  test('summarises long string values without echoing raw payload', () => {
    const long = 'x'.repeat(300);
    const out = sanitizer.forEncoderValue('recipient', long);
    expect(out).toEqual({
      truncated: true,
      length: 300,
      kind: 'string'
    });
  });

  test('summarises long Uint8Array values', () => {
    const buf = new Uint8Array(300).fill(7);
    const out = sanitizer.forEncoderValue('blob', buf);
    expect(out).toEqual({
      truncated: true,
      length: 300,
      kind: 'Uint8Array'
    });
  });

  test('passes through short non-sensitive values unchanged', () => {
    expect(sanitizer.forEncoderValue('recipient', '0xabc')).toBe('0xabc');
    expect(sanitizer.forEncoderValue('x', new Uint8Array([1, 2, 3]))).toEqual(new Uint8Array([1, 2, 3]));
  });
});
