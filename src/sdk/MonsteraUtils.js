/**
 * Cross-cutting SDK utilities that are not part of the public instance API and are not
 * re-exported from the package entry. Today this is only the optional npm version check
 * (deduplicated per process).
 *
 * @see {@link checkAndWarnVersion} in `internal/versionCheck.js`
 */

import { checkAndWarnVersion } from '../internal/versionCheck.js';

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

