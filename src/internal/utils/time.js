/**
 * Shared time helpers (Unix seconds, minute buckets).
 */

import { ValidationError } from '../../errors/index.js';

/**
 * Current Unix timestamp in whole seconds (local clock).
 *
 * @returns {number}
 */
function nowUnixTimestampSeconds() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Floor unix timestamp (seconds) to the start of its minute bucket.
 *
 * @param {number} timestampSeconds
 * @returns {number}
 */
function floorTimestampToMinuteBucket(timestampSeconds) {
  if (
    typeof timestampSeconds !== 'number' ||
    !Number.isFinite(timestampSeconds) ||
    !Number.isInteger(timestampSeconds) ||
    timestampSeconds < 0
  ) {
    throw new ValidationError(
      'timestampSeconds must be a finite non-negative integer',
      'timestampSeconds',
      timestampSeconds
    );
  }
  return Math.floor(timestampSeconds / 60) * 60;
}

export { nowUnixTimestampSeconds, floorTimestampToMinuteBucket };
