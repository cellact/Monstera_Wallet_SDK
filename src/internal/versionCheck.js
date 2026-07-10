/**
 * Optional npm-registry version check used by {@link MonsteraUtils.checkVersionOnce}.
 *
 * Three layers:
 * - {@link compareVersions} / {@link getVersionType} (in {@code utils/version.js}) — pure semver
 *   helpers
 * - {@link fetchLatestVersion} — npm registry fetch (Node-only, CORS-safe in browsers)
 * - {@link checkAndWarnVersion} — orchestrates fetch + compare + warn at {@code log.warn} level
 *
 * Failures are swallowed so the SDK never breaks because of registry issues.
 *
 *
 * @module internal/versionCheck
 */

import { compareVersions, getVersionType } from './utils/version.js';
import log from './logger.js';

/**
 * Compare two semver strings and produce a structured outdated / up-to-date / newer result.
 *
 * @public
 * @async
 * @param {string} currentVersion - Currently running SDK version
 * @param {string} latestVersion - Latest available version (e.g. from npm registry)
 * @returns {Promise<VersionCheckResult>} Structured comparison result with a human-readable
 *   {@code recommendation}
 */
export async function checkVersion(currentVersion, latestVersion) {
  log.debug('Checking SDK version', { currentVersion, latestVersion });
  const comparison = compareVersions(currentVersion, latestVersion);
  const versionType = getVersionType(currentVersion, latestVersion);
  
  return {
    isOutdated: comparison < 0,
    isLatest: comparison === 0,
    isNewer: comparison > 0,
    versionType,
    currentVersion,
    latestVersion,
    recommendation: comparison < 0 
      ? `Update to ${latestVersion} (${versionType} update available)`
      : 'You are using the latest version'
  };
}

/**
 * Fetch the latest published version of {@code @monstera_protocol/sdk} from the npm registry.
 *
 * @description Skipped in browser environments where the registry is unreachable via CORS.
 * Always swallows fetch / parse errors and returns {@code null} so callers never see exceptions.
 *
 * @public
 * @async
 * @returns {Promise<string | null>} Latest version string, or {@code null} when the lookup is
 *   skipped or fails
 */
export async function fetchLatestVersion() {
  log.debug('fetchLatestVersion', {});
  if (typeof window !== 'undefined') {
    log.debug('fetchLatestVersion skipped: browser environment (npm registry not reachable via CORS)');
    return null;
  }
  try {
    const response = await fetch('https://registry.npmjs.org/@monstera_protocol/sdk/latest');
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.version;
  } catch (error) {
    log.warn('Failed to fetch latest version', { error: error.message });
    return null;
  }
}

/**
 * Compare {@code currentVersion} against the latest published version and {@code log.warn} when
 * a non-patch update is available.
 *
 * @description Skips when {@code currentVersion} is the literal {@code "unknown"} (e.g. broken
 * build) or the registry lookup fails. Patch / prerelease updates are intentionally not warned
 * about. Errors are caught upstream by {@link MonsteraUtils.checkVersionOnce}.
 *
 * @public
 * @async
 * @param {string} currentVersion - Currently running SDK version
 * @returns {Promise<void>}
 */
export async function checkAndWarnVersion(currentVersion) {
  if (currentVersion === 'unknown') {
    return;
  }
  
  const latestVersion = await fetchLatestVersion();
  
  if (!latestVersion) {
    log.debug('checkAndWarnVersion', { skipped: true, reason: 'no latest version' });
    return;
  }

  const result = await checkVersion(currentVersion, latestVersion);
  
  if (result.isOutdated) {
    if (result.versionType === 'major' || result.versionType === 'minor') {
      log.warn('Monstera SDK update available', {
        currentVersion,
        latestVersion,
        versionType: result.versionType,
        recommendation: 'npm install @monstera_protocol/sdk@latest'
      });
    }
  }
}
