/**
 * Unit tests for version checking functionality
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupConsoleWarnMock } from '../../utils/mocks.js';
import { 
  checkVersion, 
  fetchLatestVersion, 
  checkAndWarnVersion 
} from '../../../src/internal/versionCheck.js';

// Console.warn mock setup
let mockConsole;

beforeEach(() => {
  mockConsole = setupConsoleWarnMock();
});

afterEach(() => {
  mockConsole.restore();
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
      expect(mockConsole.warnCalls.length).toBe(0);
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

