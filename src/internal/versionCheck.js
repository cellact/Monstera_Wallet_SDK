import { compareVersions, getVersionType } from './version.js';
import Monstera from '../sdk/Monstera.js';

/**
 * Check if current version is outdated
 * @param {string} currentVersion - Current SDK version
 * @param {string} latestVersion - Latest available version
 * @returns {Object} Check result with status and recommendations
 */
export async function checkVersion(currentVersion, latestVersion) {
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
  // Only check in Node.js (browser has CORS issues with npm registry)
  if (typeof window === 'undefined') {
    try {
      const response = await fetch('https://registry.npmjs.org/@monstera_protocol/sdk/latest');
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.version;
    } catch (error) {
      // Silently fail - don't spam console in case of network issues
      return null;
    }
  }
  return null; // Browser - skip (CORS issues)
}

/**
 * Check version and display warning if outdated
 * This is called automatically by the SDK
 * @returns {Promise<void>}
 */
export async function checkAndWarnVersion() {
  // Get current version
  const currentVersion = Monstera.version;
  
  // Skip if version is unknown (e.g., in some build scenarios)
  if (currentVersion === 'unknown') {
    return;
  }
  
  // Fetch latest version
  const latestVersion = await fetchLatestVersion();
  
  if (!latestVersion) {
    return; // Failed to fetch, silently skip
  }

  // Check if outdated
  const result = await checkVersion(currentVersion, latestVersion);
  
  if (result.isOutdated) {
    // Only warn for major/minor updates (not patch/prerelease)
    if (result.versionType === 'major' || result.versionType === 'minor') {
      console.warn(
        `\n⚠️  Monstera SDK Update Available\n` +
        `   You are running version ${currentVersion}, but version ${latestVersion} is available.\n` +
        `   This is a ${result.versionType} update that may include important fixes and improvements.\n` +
        `   \n` +
        `   To update, run:\n` +
        `   npm install @monstera_protocol/sdk@latest\n`
      );
    }
  }
}