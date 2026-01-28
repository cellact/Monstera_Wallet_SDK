/**
 * Monstera SDK Utilities
 * 
 * Utility functions for SDK instance management and helpers.
 * These are pure functions or instance-independent helpers.
 */

import { checkAndWarnVersion } from '../internal/versionCheck.js';

/**
 * Monstera SDK Utilities
 * 
 * Provides utility functions for SDK operations.
 */
class MonsteraUtils {
  // Static cache for version check (to avoid multiple checks)
  static _versionCheckPromise = null;
  static _versionCheckDone = false;

  /**
   * Check version once per process (cached)
   * 
   * This is a utility function that can be called independently of SDK instances.
   * It checks for SDK updates and warns users if a newer version is available.
   * 
   * @static
   * @param {string} currentVersion - Current SDK version
   * @returns {void}
   */
  static checkVersionOnce(currentVersion) {
    // If check is already in progress, don't start another
    if (MonsteraUtils._versionCheckPromise) {
      return;
    }

    // Mark as done immediately to prevent multiple checks
    MonsteraUtils._versionCheckDone = true;

    // Start async check (fire and forget)
    MonsteraUtils._versionCheckPromise = checkAndWarnVersion(currentVersion)
      .catch(() => {
        // Silently fail - version check should never break SDK usage
      })
      .finally(() => {
        MonsteraUtils._versionCheckPromise = null;
      });
  }

  /**
   * Check if version check has been done
   * @static
   * @returns {boolean}
   */
  static get versionCheckDone() {
    return MonsteraUtils._versionCheckDone;
  }
}

export default MonsteraUtils;

