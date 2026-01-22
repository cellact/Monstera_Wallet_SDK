/**
 * Version comparison and utility functions
 */

/**
 * Parse semantic version string into components
 * @param {string} version - Semantic version string
 * @returns {Object} Parsed version object with {major, minor, patch, prerelease, build}
 */
export function parseVersion(version) {
    if (typeof version !== 'string') {
      throw new TypeError(`Version must be a string, got ${typeof version}`);
    }
  
    // Match semantic version pattern: major.minor.patch[-prerelease][+build]
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?(?:\+([\w.-]+))?$/;
    const match = version.match(semverRegex);
  
    if (!match) {
      throw new Error(`Invalid semantic version: ${version}`);
    }
  
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || null,
      build: match[5] || null,
      raw: version
    };
  }
  
  /**
   * Compare two versions
   * @param {string} v1 - First version
   * @param {string} v2 - Second version
   * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  export function compareVersions(v1, v2) {
    const parsed1 = parseVersion(v1);
    const parsed2 = parseVersion(v2);
  
    // Compare major
    if (parsed1.major !== parsed2.major) {
      return parsed1.major < parsed2.major ? -1 : 1;
    }
  
    // Compare minor
    if (parsed1.minor !== parsed2.minor) {
      return parsed1.minor < parsed2.minor ? -1 : 1;
    }
  
    // Compare patch
    if (parsed1.patch !== parsed2.patch) {
      return parsed1.patch < parsed2.patch ? -1 : 1;
    }
  
    // Compare prerelease (version with prerelease is less than version without)
    if (parsed1.prerelease !== parsed2.prerelease) {
      if (parsed1.prerelease === null) return 1; // v1 is stable, v2 is prerelease
      if (parsed2.prerelease === null) return -1; // v2 is stable, v1 is prerelease
      
      // Both have prerelease - compare lexicographically
      return parsed1.prerelease < parsed2.prerelease ? -1 : 
             parsed1.prerelease > parsed2.prerelease ? 1 : 0;
    }
  
    return 0; // Versions are equal
  }
  
  /**
   * Check if version satisfies range
   * Supports: ^, ~, >=, <=, >, <, =, and combinations
   * @param {string} version - Version to check
   * @param {string} range - Range string (e.g., "^1.0.0", ">=1.0.0", "1.0.0 - 2.0.0")
   * @returns {boolean}
   */
  export function satisfiesRange(version, range) {
    const parsedVersion = parseVersion(version);
  
    // Handle caret (^) - compatible within same major version
    if (range.startsWith('^')) {
      const rangeVersionStr = range.slice(1);  // Get the string version
      const rangeVersion = parseVersion(rangeVersionStr);  // Parse for comparison
      if (parsedVersion.major !== rangeVersion.major) return false;
      return compareVersions(version, rangeVersionStr) >= 0;  // Use string version for comparison
    }
  
    // Handle tilde (~) - compatible within same minor version
    if (range.startsWith('~')) {
      const rangeVersionStr = range.slice(1);  // Get the string version
      const rangeVersion = parseVersion(rangeVersionStr);  // Parse for comparison
      if (parsedVersion.major !== rangeVersion.major) return false;
      if (parsedVersion.minor !== rangeVersion.minor) return false;
      return compareVersions(version, rangeVersionStr) >= 0;  // Use string version for comparison
    }
  
    // Handle >=, <=, >, <, =
    if (range.startsWith('>=')) {
      const rangeVersion = range.slice(2).trim();
      return compareVersions(version, rangeVersion) >= 0;
    }
    if (range.startsWith('<=')) {
      const rangeVersion = range.slice(2).trim();
      return compareVersions(version, rangeVersion) <= 0;
    }
    if (range.startsWith('>')) {
      const rangeVersion = range.slice(1).trim();
      return compareVersions(version, rangeVersion) > 0;
    }
    if (range.startsWith('<')) {
      const rangeVersion = range.slice(1).trim();
      return compareVersions(version, rangeVersion) < 0;
    }
    if (range.startsWith('=')) {
      const rangeVersion = range.slice(1).trim();
      return compareVersions(version, rangeVersion) === 0;
    }
  
    // Exact match
    if (compareVersions(version, range) === 0) {
      return true;
    }
  
    // Range with dash (e.g., "1.0.0 - 2.0.0")
    if (range.includes(' - ')) {
      const [min, max] = range.split(' - ').map(s => s.trim());
      return compareVersions(version, min) >= 0 && compareVersions(version, max) <= 0;
    }
  
    return false;
  }
  
  /**
   * Get version type difference between two versions
   * @param {string} v1 - First version
   * @param {string} v2 - Second version
   * @returns {string} 'major', 'minor', 'patch', 'prerelease', or 'equal'
   */
  export function getVersionType(v1, v2) {
    const parsed1 = parseVersion(v1);
    const parsed2 = parseVersion(v2);
  
    if (parsed1.major !== parsed2.major) return 'major';
    if (parsed1.minor !== parsed2.minor) return 'minor';
    if (parsed1.patch !== parsed2.patch) return 'patch';
    if (parsed1.prerelease !== parsed2.prerelease) return 'prerelease';
    return 'equal';
  }