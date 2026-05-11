/**
 * Sanitization barrel.
 *
 * Exposes:
 * - {@link SENSITIVE_PARAM_NAMES} — frozen list of parameter names whose values must never appear
 *   in logs / errors / debug output
 * - {@link Sanitizer} — class with redaction helpers used by errors / logger / pipeline
 * - {@link sanitizer} — process-wide singleton bound to {@link SENSITIVE_PARAM_NAMES}
 *
 * @module internal/sanitization
 */

import { SENSITIVE_PARAM_NAMES } from './SensitiveParams.js';
import { Sanitizer } from './Sanitizer.js';

export { SENSITIVE_PARAM_NAMES } from './SensitiveParams.js';
export { Sanitizer } from './Sanitizer.js';

/**
 * Process-wide {@link Sanitizer} instance bound to {@link SENSITIVE_PARAM_NAMES}.
 *
 * @public
 * @readonly
 * @type {Sanitizer}
 */
export const sanitizer = new Sanitizer(SENSITIVE_PARAM_NAMES);
