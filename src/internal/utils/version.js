/**
 * Pure semver helpers used by the optional npm version-check flow.
 *
 * Implements just enough of the semver spec for our needs:
 * - {@link parseVersion} — split a {@code MAJOR.MINOR.PATCH[-PRE][+BUILD]} string
 * - {@link compareVersions} — three-way compare two semver strings
 * - {@link getVersionType} — classify the difference ({@code major}/{@code minor}/...)
 * - {@link satisfiesRange} — minimal range-matcher (caret, tilde, comparison ops, dash range)
 *
 * @module internal/utils/version
 */

import { requireString } from '../validation/assert.js';

/**
 * Parse a semver string into structured components.
 *
 * @public
 * @param {string} version - Semver string like {@code "1.2.3-rc.1+build5"}
 * @returns {{ major: number, minor: number, patch: number, prerelease: string | null, build: string | null, raw: string }}
 *   Parsed components with the original {@code raw} string preserved
 * @throws {ValidationError} If {@code version} fails {@link requireString}
 * @throws {Error} If {@code version} does not match the semver pattern
 */
export function parseVersion(version) {
    requireString(version, 'version');

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
   * Three-way comparison of two semver strings.
   *
   * @description Standard semver precedence: major / minor / patch numerically; prerelease
   * lexicographic, with a stable version ranked higher than any prerelease.
   *
   * @public
   * @param {string} v1 - Left operand
   * @param {string} v2 - Right operand
   * @returns {-1 | 0 | 1} {@code -1} when {@code v1 < v2}, {@code 0} when equal, {@code 1} when
   *   {@code v1 > v2}
   * @throws {Error} Forwarded from {@link parseVersion}
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
   * Test whether a version satisfies a range expression.
   *
   * @description Recognises the operators {@code ^}, {@code ~}, {@code >=}, {@code <=}, {@code >},
   * {@code <}, {@code =}, an exact version, and the dash range {@code "A - B"}. NOT a full semver
   * range implementation — does not handle compound ranges, OR clauses ({@code "||"}), pre-release
   * inclusion rules, etc.
   *
   * @public
   * @param {string} version - Concrete version to test
   * @param {string} range - Range expression
   * @returns {boolean} {@code true} if {@code version} satisfies {@code range}
   * @throws {Error} Forwarded from {@link parseVersion} / {@link compareVersions}
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
   * Classify the kind of difference between two versions.
   *
   * @description Returns the highest-priority component that differs ({@code "major"} > {@code
   * "minor"} > {@code "patch"} > {@code "prerelease"}), or {@code "equal"} when the two versions
   * are identical.
   *
   * @public
   * @param {string} v1 - Left operand
   * @param {string} v2 - Right operand
   * @returns {'major' | 'minor' | 'patch' | 'prerelease' | 'equal'} Difference classification
   * @throws {Error} Forwarded from {@link parseVersion}
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
