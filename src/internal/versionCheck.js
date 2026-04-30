/**
 * @typedef {import('../types/index.js').VersionCheckResult} VersionCheckResult
 */

import { compareVersions, getVersionType } from './utils/version.js';
import log from './logger.js';

/**
 * Check if current version is outdated
 * @param {string} currentVersion - Current SDK version
 * @param {string} latestVersion - Latest available version
 * @returns {Promise<VersionCheckResult>}
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
 * Fetch latest version from npm registry
 * @returns {Promise<string|null>} Latest version or null if fetch fails
 */
export async function fetchLatestVersion() {
  log.debug('fetchLatestVersion', {});
  // Only check in Node.js (browser has CORS issues with npm registry)
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
    // Silently fail - don't spam console in case of network issues
    return null;
  }
}

/**
 * Check version and display warning if outdated.
 * This runs only when the SDK is configured with `checkVersion: true`.
 * @param {string} currentVersion - Current SDK version
 * @returns {Promise<void>}
 */
export async function checkAndWarnVersion(currentVersion) {
  // Skip if version is unknown (e.g., in some build scenarios)
  if (currentVersion === 'unknown') {
    return;
  }
  
  // Fetch latest version
  const latestVersion = await fetchLatestVersion();
  
  if (!latestVersion) {
    log.debug('checkAndWarnVersion', { skipped: true, reason: 'no latest version' });
    return; // Failed to fetch, silently skip
  }

  // Check if outdated
  const result = await checkVersion(currentVersion, latestVersion);
  
  if (result.isOutdated) {
    // Only warn for major/minor updates (not patch/prerelease)
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
