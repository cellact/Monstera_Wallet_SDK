/**
 * Shared time helpers (Unix seconds, minute buckets).
 */

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
  return Math.floor(Number(timestampSeconds) / 60) * 60;
}

export { nowUnixTimestampSeconds, floorTimestampToMinuteBucket };
