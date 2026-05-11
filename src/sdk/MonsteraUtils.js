/**
 * Cross-cutting SDK utilities that are intentionally kept out of the public instance API
 * and not re-exported from the package entry. Today this is only the optional, deduplicated
 * npm version check.
 *
 * @see {@link checkAndWarnVersion} in `internal/versionCheck.js`
 * @module sdk/MonsteraUtils
 */

import { checkAndWarnVersion } from '../internal/versionCheck.js';

/**
 * Static-only helper class. Holds module-level state (promise/done flags) for the version check
 * so that it runs at most once per Node process across many {@link Monstera} instances.
 *
 * @public
 */
class MonsteraUtils {
  /**
   * In-flight version check promise (single shared promise to prevent duplicate npm calls).
   * @type {Promise<void>|null}
   * @private
   */
  static _versionCheckPromise = null;

  /**
   * Latched flag indicating whether the version check has already been kicked off this process.
   * @type {boolean}
   * @private
   */
  static _versionCheckDone = false;

  /**
   * Run the npm version check at most once per process (best-effort, fire-and-forget).
   *
   * Latches {@link MonsteraUtils._versionCheckDone} immediately so that subsequent
   * {@link Monstera} constructions skip the network call. Failures are swallowed by design —
   * the version check must never break SDK usage.
   *
   * @public
   * @static
   * @param {string} currentVersion - Current SDK version (e.g. {@code "1.2.3"})
   * @returns {void}
   * @remarks Called by the {@link Monstera} constructor only when {@code config.checkVersion === true}.
   */
  static checkVersionOnce(currentVersion) {
    if (MonsteraUtils._versionCheckPromise) {
      return;
    }

    MonsteraUtils._versionCheckDone = true;

    MonsteraUtils._versionCheckPromise = checkAndWarnVersion(currentVersion)
      .catch(() => {
        // Silently fail - version check should never break SDK usage
      })
      .finally(() => {
        MonsteraUtils._versionCheckPromise = null;
      });
  }

  /**
   * Whether the version check has already been kicked off in this process.
   *
   * @public
   * @static
   * @readonly
   * @returns {boolean} {@code true} once {@link MonsteraUtils.checkVersionOnce} has been called
   */
  static get versionCheckDone() {
    return MonsteraUtils._versionCheckDone;
  }
}

export default MonsteraUtils;
