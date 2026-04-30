/**
 * Parameter names whose values must never be stored on errors, logs, or debugging output.
 * Single source of truth for {@link MonsteraConfig.SENSITIVE_PARAMS} and {@link ValidationError}.
 */

/** @type {readonly string[]} */
const SENSITIVE_PARAM_NAMES = Object.freeze([
  'authConfig',
  'authProof',
  'currentPassword',
  'newPasswordHash',
  'passwordHash',
  'seed',
  'mnemonic',
  'hookData',
  'logicData',
  'txData',
  'data',
  'message',
  'hash',
  'privateKey',
  'password',
  'providedSigner'
]);

const SENSITIVE_SET = new Set(SENSITIVE_PARAM_NAMES);

/**
 * @param {string} parameter
 * @returns {boolean}
 */
function isSensitiveParamName(parameter) {
  return typeof parameter === 'string' && SENSITIVE_SET.has(parameter);
}

/**
 * Safe serializable stand-in for a redacted validation value.
 * @typedef {{ redacted: true, valueKind: string, valueLength?: number }} RedactedValidationValue
 */

/**
 * @param {string} parameter
 * @param {unknown} value
 * @returns {unknown | RedactedValidationValue}
 */
function sanitizeValidationValue(parameter, value) {
  if (!isSensitiveParamName(parameter)) {
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
function sanitizeErrorContextShallow(ctx) {
  if (!ctx || typeof ctx !== 'object') {
    return {};
  }
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, val] of Object.entries(ctx)) {
    if (isSensitiveParamName(key)) {
      out[key] = sanitizeValidationValue(key, val);
    } else if (key === 'value' && typeof ctx.parameter === 'string' && isSensitiveParamName(ctx.parameter)) {
      out[key] = sanitizeValidationValue(ctx.parameter, val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

/** Max length before ABI encoder error values are summarized without raw payload. */
const MAX_ENCODER_VALUE_RAW_LENGTH = 256;

/**
 * @param {string} argumentLabel - ethers may use numeric index or name
 * @param {unknown} value
 * @returns {unknown}
 */
function sanitizeEncoderErrorValue(argumentLabel, value) {
  const name = typeof argumentLabel === 'string' ? argumentLabel : String(argumentLabel ?? '');
  if (name && isSensitiveParamName(name)) {
    return sanitizeValidationValue(name, value);
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

export {
  SENSITIVE_PARAM_NAMES,
  isSensitiveParamName,
  sanitizeValidationValue,
  sanitizeErrorContextShallow,
  sanitizeEncoderErrorValue
};
