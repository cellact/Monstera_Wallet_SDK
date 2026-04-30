/**
 * Unit tests for version utilities
 */

import { describe, test, expect } from '@jest/globals';

import { 
  compareVersions, 
  parseVersion, 
  satisfiesRange, 
  getVersionType 
} from '../../../../src/internal/utils/version.js';

describe('Version Utilities', () => {
  describe('parseVersion', () => {
    test('parses standard version correctly', () => {
      const parsed = parseVersion('1.0.0');
      expect(parsed).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: null,
        build: null,
        raw: '1.0.0'
      });
    });

    test('parses version with prerelease', () => {
      const parsed = parseVersion('1.0.0-alpha.2');
      expect(parsed).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: 'alpha.2',
        build: null,
        raw: '1.0.0-alpha.2'
      });
    });

    test('parses version with build metadata', () => {
      const parsed = parseVersion('1.0.0+build.123');
      expect(parsed.build).toBe('build.123');
    });

    test('throws error for invalid version', () => {
      expect(() => parseVersion('invalid')).toThrow('Invalid semantic version');
      expect(() => parseVersion('1.0')).toThrow('Invalid semantic version');
      expect(() => parseVersion('')).toThrow('version is required and must be a non-empty string');
    });

    test('throws error for non-string input', () => {
      expect(() => parseVersion(123)).toThrow('version is required and must be a non-empty string');
      expect(() => parseVersion(null)).toThrow('version is required and must be a non-empty string');
    });
  });

  describe('compareVersions', () => {
    test('returns -1 when v1 < v2', () => {
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });

    test('returns 1 when v1 > v2', () => {
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    });

    test('returns 0 when versions are equal', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.5.3', '2.5.3')).toBe(0);
    });

    test('handles prerelease versions', () => {
      expect(compareVersions('1.0.0-alpha.2', '1.0.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.0.0-alpha.2')).toBe(1);
    });
  });

  describe('satisfiesRange', () => {
    test('satisfies caret range', () => {
      expect(satisfiesRange('1.0.0', '^1.0.0')).toBe(true);
      expect(satisfiesRange('1.1.0', '^1.0.0')).toBe(true);
      expect(satisfiesRange('1.9.9', '^1.0.0')).toBe(true);
      expect(satisfiesRange('2.0.0', '^1.0.0')).toBe(false);
    });

    test('satisfies >= range', () => {
      expect(satisfiesRange('1.0.0', '>=1.0.0')).toBe(true);
      expect(satisfiesRange('1.1.0', '>=1.0.0')).toBe(true);
      expect(satisfiesRange('0.9.0', '>=1.0.0')).toBe(false);
    });

    test('satisfies exact version', () => {
      expect(satisfiesRange('1.0.0', '1.0.0')).toBe(true);
      expect(satisfiesRange('1.0.1', '1.0.0')).toBe(false);
    });
  });

  describe('getVersionType', () => {
    test('identifies major updates', () => {
      expect(getVersionType('1.0.0', '2.0.0')).toBe('major');
      expect(getVersionType('1.9.9', '2.0.0')).toBe('major');
    });

    test('identifies minor updates', () => {
      expect(getVersionType('1.0.0', '1.1.0')).toBe('minor');
      expect(getVersionType('1.0.9', '1.1.0')).toBe('minor');
    });

    test('identifies patch updates', () => {
      expect(getVersionType('1.0.0', '1.0.1')).toBe('patch');
      expect(getVersionType('1.0.0', '1.0.5')).toBe('patch');
    });

    test('identifies prerelease updates', () => {
      expect(getVersionType('1.0.0-alpha.1', '1.0.0-alpha.2')).toBe('prerelease');
    });

    test('identifies equal versions', () => {
      expect(getVersionType('1.0.0', '1.0.0')).toBe('equal');
    });
  });
});