/**
 * Shared time helpers used by deadline assertions and the minute-bucket auth flows.
 *
 * @module internal/utils/time
 */

import { ValidationError } from '../../errors/index.js';

/**
 * Current Unix timestamp in whole seconds, taken from the local clock.
 *
 * @public
 * @returns {number} {@code Math.floor(Date.now() / 1000)}
 */
function nowUnixTimestampSeconds() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Floor a Unix timestamp (in seconds) to the start of its minute bucket.
 *
 * @description Used by the password-minute / dual-factor auth flows so off-chain and on-chain
 * agree on the same bucket to derive the ephemeral signer.
 *
 * @public
 * @param {number} timestampSeconds - Unix timestamp in seconds
 * @returns {number} Largest multiple of 60 that is ≤ {@code timestampSeconds}
 * @throws {ValidationError} If {@code timestampSeconds} is not a finite non-negative integer
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
