/**
 * Safe serializable stand-in for a redacted validation value.
 * @typedef {{ redacted: true, valueKind: string, valueLength?: number }} RedactedValidationValue
 */

/** Placeholder for sensitive keys in log output (string for readable `log.debug` JSON). */
const LOG_REDACTED = '[redacted]';

/** Max length before ABI encoder error values are summarized without raw payload. */
const MAX_ENCODER_VALUE_RAW_LENGTH = 256;

export class Sanitizer {
  /**
   * @param {readonly string[]} sensitiveKeys
   */
  constructor(sensitiveKeys) {
    this._keys = new Set(sensitiveKeys);
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  isSensitive(key) {
    return typeof key === 'string' && this._keys.has(key);
  }

  /**
   * Deep clone for debug logs — JSON-serializable summary safe for logging.
   *
   * @param {unknown} value - Typically a method `options` bag
   * @param {number} [maxDepth=6]
   * @returns {unknown}
   */
  forLog(value, maxDepth = 6) {
    return this._forLogInner(value, 0, maxDepth, new WeakSet());
  }

  /**
   * @param {string} paramName
   * @param {unknown} value
   * @returns {unknown | RedactedValidationValue}
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
   * Redact values for sensitive keys in a shallow context object (error translator / ABI context).
   *
   * @param {Record<string, unknown>} ctx
   * @returns {Record<string, unknown>}
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
      } else {
        out[key] = val;
      }
    }
    return out;
  }

  /**
   * @param {string} argLabel - ethers may use numeric index or name
   * @param {unknown} value
   * @returns {unknown}
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
   * @param {unknown} value
   * @param {number} depth
   * @param {number} maxDepth
   * @param {WeakSet<object>} visiting - Cycle detection (enter add / leave delete)
   * @returns {unknown}
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
