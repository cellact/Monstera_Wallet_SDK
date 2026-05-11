/**
 * Redaction helpers used by the logger, error pipeline and {@link ValidationError} construction.
 *
 * The same instance is reused across the SDK as the {@code sanitizer} singleton in
 * {@link ./index.js}.
 *
 * @module internal/sanitization/Sanitizer
 */

/**
 * Safe serializable stand-in for a redacted validation value.
 *
 * @typedef {{ redacted: true, valueKind: string, valueLength?: number }} RedactedValidationValue
 */

/**
 * Placeholder for sensitive keys in log output (string for readable {@code log.debug} JSON).
 *
 * @private
 * @readonly
 */
const LOG_REDACTED = '[redacted]';

/**
 * Max length before an ABI encoder error value is summarised without its raw payload.
 *
 * @private
 * @readonly
 */
const MAX_ENCODER_VALUE_RAW_LENGTH = 256;

/**
 * Redacts sensitive parameter values out of logs, errors, and ABI encoder context.
 *
 * @public
 */
export class Sanitizer {
  /**
   * @public
   * @param {readonly string[]} sensitiveKeys - Parameter names to consider sensitive (typically
   *   {@link SENSITIVE_PARAM_NAMES})
   */
  constructor(sensitiveKeys) {
    this._keys = new Set(sensitiveKeys);
  }

  /**
   * Whether a parameter name is in the sensitive set.
   *
   * @public
   * @param {string} key - Parameter / context key
   * @returns {boolean} {@code true} if {@code key} is sensitive
   */
  isSensitive(key) {
    return typeof key === 'string' && this._keys.has(key);
  }

  /**
   * Produce a JSON-safe deep clone with sensitive keys redacted, suitable for {@code log.debug}.
   *
   * @description Walks the value up to {@code maxDepth} levels, replacing sensitive object keys
   * with {@code "[redacted]"}, summarising {@link Uint8Array}s as {@code "Uint8Array(N)"},
   * stringifying bigints / symbols / functions, and detecting cycles.
   *
   * @public
   * @param {unknown} value - Typically a method's {@code options} bag
   * @param {number} [maxDepth=6] - Maximum recursion depth before falling back to
   *   {@code "[max depth]"}
   * @returns {unknown} JSON-serialisable summary
   */
  forLog(value, maxDepth = 6) {
    return this._forLogInner(value, 0, maxDepth, new WeakSet());
  }

  /**
   * Produce the value stored on a {@link ValidationError} for a given parameter.
   *
   * @description Non-sensitive values pass through unchanged; sensitive values are replaced with a
   * {@link RedactedValidationValue} carrying just the {@code valueKind} (and {@code valueLength}
   * for strings / {@link Uint8Array}s).
   *
   * @public
   * @param {string} paramName - Parameter name being validated
   * @param {unknown} value - Original parameter value
   * @returns {unknown | RedactedValidationValue} Original value, or redacted summary
   */
  forValidationValue(paramName, value) {
    if (!this.isSensitive(paramName)) {
      return value;
    }
    let valueKind = typeof value;
    if (value === null) {
      valueKind = 'null';
    } else if (value === undefined) {
      valueKind = 'undefined';
    } else if (value instanceof Uint8Array) {
      valueKind = 'Uint8Array';
    }
    /** @type {RedactedValidationValue} */
    const out = { redacted: true, valueKind };
    if (typeof value === 'string') {
      out.valueLength = value.length;
    } else if (value instanceof Uint8Array) {
      out.valueLength = value.length;
    }
    return out;
  }

  /**
   * Redact values for sensitive keys in an error / translator context object.
   *
   * @description Top-level sensitive keys are replaced with {@link RedactedValidationValue}
   * summaries; if {@code ctx} has {@code parameter}/{@code value} pair (the {@link ValidationError}
   * shape) the {@code value} is redacted using {@code parameter} as the lookup key. Any
   * {@code extraData} sub-object is recursed one level so nested secrets (e.g. a spread mnemonic)
   * are still redacted, even though the write pipeline currently excludes {@code extraData} from
   * error context.
   *
   * @public
   * @param {Record<string, unknown>} ctx - Free-form context bag
   * @returns {Record<string, unknown>} Sanitised copy ({@code ctx} is NOT mutated)
   */
  forErrorContext(ctx) {
    if (!ctx || typeof ctx !== 'object') {
      return {};
    }
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [key, val] of Object.entries(ctx)) {
      if (this.isSensitive(key)) {
        out[key] = this.forValidationValue(key, val);
      } else if (key === 'value' && typeof ctx.parameter === 'string' && this.isSensitive(ctx.parameter)) {
        out[key] = this.forValidationValue(ctx.parameter, val);
      } else if (
        key === 'extraData' &&
        val !== null &&
        typeof val === 'object' &&
        !Array.isArray(val)
      ) {
        out[key] = this.forErrorContext(/** @type {Record<string, unknown>} */ (val));
      } else {
        out[key] = val;
      }
    }
    return out;
  }

  /**
   * Sanitise a value reported by an ethers ABI encoder error.
   *
   * @description If {@code argLabel} matches a sensitive parameter, the value is redacted via
   * {@link forValidationValue}. Otherwise long strings / {@link Uint8Array}s are summarised so we
   * don't echo huge payloads into logs.
   *
   * @public
   * @param {string} argLabel - Argument label as reported by ethers (numeric index or name)
   * @param {unknown} value - Argument value as reported by ethers
   * @returns {unknown} Original value, redacted summary, or truncated descriptor
   */
  forEncoderValue(argLabel, value) {
    const name = typeof argLabel === 'string' ? argLabel : String(argLabel ?? '');
    if (name && this.isSensitive(name)) {
      return this.forValidationValue(name, value);
    }
    if (typeof value === 'string' && value.length > MAX_ENCODER_VALUE_RAW_LENGTH) {
      return {
        truncated: true,
        length: value.length,
        kind: 'string'
      };
    }
    if (value instanceof Uint8Array && value.length > MAX_ENCODER_VALUE_RAW_LENGTH) {
      return {
        truncated: true,
        length: value.length,
        kind: 'Uint8Array'
      };
    }
    return value;
  }

  /**
   * Recursive backend for {@link forLog} with cycle detection.
   *
   * @private
   * @param {unknown} value - Current value
   * @param {number} depth - Current recursion depth
   * @param {number} maxDepth - Maximum depth before bail-out
   * @param {WeakSet<object>} visiting - Cycle-detection set (enter-add / leave-delete)
   * @returns {unknown} JSON-serialisable summary for the current node
   */
  _forLogInner(value, depth, maxDepth, visiting) {
    if (value === null || value === undefined) {
      return value;
    }
    if (depth > maxDepth) {
      return '[max depth]';
    }

    const t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean') {
      return value;
    }
    if (t === 'bigint') {
      return value.toString();
    }
    if (t === 'symbol') {
      return String(value);
    }
    if (t === 'function') {
      return '[Function]';
    }

    if (value instanceof Uint8Array) {
      return `Uint8Array(${value.length})`;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      if (visiting.has(value)) {
        return '[Circular]';
      }
      visiting.add(value);
      try {
        return value.map((item) => this._forLogInner(item, depth + 1, maxDepth, visiting));
      } finally {
        visiting.delete(value);
      }
    }

    if (t === 'object') {
      if (visiting.has(value)) {
        return '[Circular]';
      }
      visiting.add(value);
      try {
        /** @type {Record<string, unknown>} */
        const out = {};
        for (const [key, val] of Object.entries(value)) {
          if (this.isSensitive(key)) {
            out[key] = LOG_REDACTED;
          } else {
            out[key] = this._forLogInner(val, depth + 1, maxDepth, visiting);
          }
        }
        return out;
      } finally {
        visiting.delete(value);
      }
    }

    return value;
  }
}
