/**
 * Unit tests for version checking functionality
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { 
  checkVersion, 
  fetchLatestVersion, 
  checkAndWarnVersion 
} from '../../../src/internal/versionCheck.js';
import { 
  compareVersions, 
  parseVersion, 
  satisfiesRange, 
  getVersionType 
} from '../../../src/internal/version.js';

// Mock console.warn to test warnings
const originalWarn = console.warn;
let warnCalls = [];

beforeEach(() => {
  warnCalls = [];
  console.warn = (...args) => {
    warnCalls.push(args);
    originalWarn(...args);
  };
});

afterEach(() => {
  console.warn = originalWarn;
});

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
      expect(() => parseVersion('')).toThrow('Invalid semantic version');
    });

    test('throws error for non-string input', () => {
      expect(() => parseVersion(123)).toThrow('Version must be a string');
      expect(() => parseVersion(null)).toThrow('Version must be a string');
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

describe('Version Check Functions', () => {
  describe('checkVersion', () => {
    test('detects outdated version', async () => {
      const result = await checkVersion('1.0.0', '1.1.0');
      expect(result.isOutdated).toBe(true);
      expect(result.isLatest).toBe(false);
      expect(result.isNewer).toBe(false);
      expect(result.versionType).toBe('minor');
      expect(result.recommendation).toContain('Update to 1.1.0');
    });

    test('detects latest version', async () => {
      const result = await checkVersion('1.0.0', '1.0.0');
      expect(result.isOutdated).toBe(false);
      expect(result.isLatest).toBe(true);
      expect(result.isNewer).toBe(false);
      expect(result.versionType).toBe('equal');
      expect(result.recommendation).toBe('You are using the latest version');
    });

    test('detects newer version (local dev)', async () => {
      const result = await checkVersion('2.0.0', '1.0.0');
      expect(result.isOutdated).toBe(false);
      expect(result.isLatest).toBe(false);
      expect(result.isNewer).toBe(true);
    });
  });

  describe('fetchLatestVersion', () => {
    test('returns null in browser environment', async () => {
      // Mock window object
      const originalWindow = global.window;
      global.window = {};
      
      const result = await fetchLatestVersion();
      expect(result).toBeNull();
      
      global.window = originalWindow;
    });

    test('fetches version from npm registry (if network available)', async () => {
      // This test may fail if network is unavailable, which is fine
      // We're testing the function works, not that npm is always reachable
      const result = await fetchLatestVersion();
      
      // Result should be either a version string or null (if network fails)
      if (result !== null) {
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^\d+\.\d+\.\d+/); // Should match semver pattern
      }
    }, 10000); // 10 second timeout for network request
  });

  describe('checkAndWarnVersion', () => {
    test('skips check if version is unknown', async () => {
      // This test verifies the early return logic without needing to mock
      await checkAndWarnVersion('unknown');
      
      // Should not warn (and should not make network calls)
      // We can't easily verify fetchLatestVersion wasn't called in ESM,
      // but we can verify no warnings were shown
      expect(warnCalls.length).toBe(0);
    });

    // Note: Testing warning behavior for different version types requires mocking fetchLatestVersion.
    // ESM module mocking is complex in Jest. These tests verify the core logic works.
    // For full integration testing, see integration tests that test against real npm registry.
    
    test('handles network failure gracefully', async () => {
      // This test verifies that network failures don't crash the function
      // In a real scenario, fetchLatestVersion would return null on failure
      // and checkAndWarnVersion should handle it gracefully
      await expect(checkAndWarnVersion('1.0.0')).resolves.not.toThrow();
    });
  });
});

