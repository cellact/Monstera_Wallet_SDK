/**
 * Internal SDK logger.
 *
 * Provides a tiny level-based logger that wraps the native {@code console.*} methods. Messages at
 * or below the current level are emitted; everything else is dropped.
 *
 * @module internal/logger
 */

/**
 * Numeric weight for each log level — lower numbers are higher priority.
 *
 * @public
 * @readonly
 */
const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * Level-filtering wrapper around {@code console}.
 *
 * @public
 */
class Logger {
  /**
   * @public
   * @param {{ level?: keyof typeof LEVELS, prefix?: string }} [options={}] - Initial level and
   *   prefix for emitted lines
   */
  constructor({ level = 'error', prefix = 'Monstera' } = {}) {
    this.level = level;
    this.prefix = prefix;
  }

  /**
   * Switch the active log level.
   *
   * @public
   * @param {keyof typeof LEVELS} level - One of {@code "error"}, {@code "warn"}, {@code "info"},
   *   {@code "debug"}
   * @returns {void}
   * @throws {Error} If {@code level} is not a known key of {@link LEVELS}
   */
  setLevel(level) {
    if (!(level in LEVELS)) {
      throw new Error(`Invalid log level: ${level}. Use: error, warn, info, debug`);
    }
    this.level = level;
  }

  /**
   * Whether the given level would currently be emitted.
   *
   * @public
   * @param {keyof typeof LEVELS} level - Candidate level
   * @returns {boolean} {@code true} if a log call at {@code level} would be printed
   */
  shouldLog(level) {
    return LEVELS[level] <= LEVELS[this.level];
  }

  /**
   * Build the prefixed argument array passed to the underlying {@code console} method.
   *
   * @private
   * @param {keyof typeof LEVELS} level - Level for the prefix
   * @param {unknown[]} args - Caller arguments
   * @returns {unknown[]} Formatted arguments
   */
  _format(level, args) {
    return [`[${this.prefix}]`, `[${level}]`, ...args];
  }

  /**
   * Emit at level {@code error}.
   * @public
   * @param {...unknown} args - Arguments forwarded to {@code console.error}
   * @returns {void}
   */
  error(...args) {
    if (this.shouldLog('error')) {
      console.error(...this._format('error', args));
    }
  }

  /**
   * Emit at level {@code warn}.
   * @public
   * @param {...unknown} args - Arguments forwarded to {@code console.warn}
   * @returns {void}
   */
  warn(...args) {
    if (this.shouldLog('warn')) {
      console.warn(...this._format('warn', args));
    }
  }

  /**
   * Emit at level {@code info}.
   * @public
   * @param {...unknown} args - Arguments forwarded to {@code console.info}
   * @returns {void}
   */
  info(...args) {
    if (this.shouldLog('info')) {
      console.info(...this._format('info', args));
    }
  }

  /**
   * Emit at level {@code debug}.
   * @public
   * @param {...unknown} args - Arguments forwarded to {@code console.debug}
   * @returns {void}
   */
  debug(...args) {
    if (this.shouldLog('debug')) {
      console.debug(...this._format('debug', args));
    }
  }
}

/**
 * Singleton logger instance used by the SDK.
 *
 * @public
 * @readonly
 * @type {Logger}
 */
const log = new Logger({ level: 'error', prefix: 'Monstera' });

export { LEVELS, Logger, log };
export default log;
