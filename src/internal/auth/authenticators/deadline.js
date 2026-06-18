/**
 * Shared deadline defaults for authenticator proofs that carry an expiry.
 *
 * @module internal/auth/authenticators/deadline
 */

import { nowUnixTimestampSeconds } from '../../utils/time.js';

/** @readonly */
export const DEFAULT_PROOF_DEADLINE_OFFSET_SEC = 3600;

/**
 * @returns {number}
 */
export function defaultProofDeadline() {
  return nowUnixTimestampSeconds() + DEFAULT_PROOF_DEADLINE_OFFSET_SEC;
}
