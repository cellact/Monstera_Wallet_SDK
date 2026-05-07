/**
 * Unit tests for internal time helpers
 */

import { describe, test, expect } from '@jest/globals';
import {
  floorTimestampToMinuteBucket,
  nowUnixTimestampSeconds
} from '../../../../src/internal/utils/time.js';

describe('internal/utils/time', () => {
  describe('nowUnixTimestampSeconds', () => {
    test('should return whole seconds aligned with Date.now()', () => {
      const before = Math.floor(Date.now() / 1000);
      const t = nowUnixTimestampSeconds();
      const after = Math.floor(Date.now() / 1000);

      expect(t).toBeGreaterThanOrEqual(before);
      expect(t).toBeLessThanOrEqual(after);
      expect(Number.isInteger(t)).toBe(true);
    });
  });

  describe('floorTimestampToMinuteBucket', () => {
    test('should floor timestamps to minute boundaries in seconds', () => {
      expect(floorTimestampToMinuteBucket(0)).toBe(0);
      expect(floorTimestampToMinuteBucket(59)).toBe(0);
      expect(floorTimestampToMinuteBucket(60)).toBe(60);
      expect(floorTimestampToMinuteBucket(125)).toBe(120);
      expect(floorTimestampToMinuteBucket(1735689625)).toBe(1735689600);
    });

    test('should throw for non-number and invalid inputs', () => {
      expect(() => floorTimestampToMinuteBucket(/** @type {any} */ ('180'))).toThrow(
        'timestampSeconds must be a finite non-negative integer'
      );
      expect(() => floorTimestampToMinuteBucket(/** @type {any} */ (NaN))).toThrow(
        'timestampSeconds must be a finite non-negative integer'
      );
      expect(() => floorTimestampToMinuteBucket(/** @type {any} */ (Infinity))).toThrow(
        'timestampSeconds must be a finite non-negative integer'
      );
      expect(() => floorTimestampToMinuteBucket(12.5)).toThrow(
        'timestampSeconds must be a finite non-negative integer'
      );
      expect(() => floorTimestampToMinuteBucket(-1)).toThrow(
        'timestampSeconds must be a finite non-negative integer'
      );
    });
  });
});
