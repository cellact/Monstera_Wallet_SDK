/**
 * Internal logger for Monstera SDK with level-based filtering.
 * Levels: error (0), warn (1), info (2), debug (3). Only messages at or below the current level are emitted.
 */

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  /**
   * @param {{ level?: keyof typeof LEVELS, prefix?: string }} [options]
   * @param {keyof typeof LEVELS} [options.level='error']
   * @param {string} [options.prefix='Monstera']
   */
  constructor({ level = 'error', prefix = 'Monstera' } = {}) {
    this.level = level;
    this.prefix = prefix;
  }

  /**
   * @param {keyof typeof LEVELS} level
   */
  setLevel(level) {
    if (!(level in LEVELS)) {
      throw new Error(`Invalid log level: ${level}. Use: error, warn, info, debug`);
    }
    this.level = level;
  }

  /**
   * @param {keyof typeof LEVELS} level
   * @returns {boolean}
   */
  shouldLog(level) {
    return LEVELS[level] <= LEVELS[this.level];
  }

  /**
   * @param {keyof typeof LEVELS} level
   * @param {unknown[]} args
   * @returns {unknown[]}
   */
  format(level, args) {
    return [`[${this.prefix}]`, `[${level}]`, ...args];
  }

  error(...args) {
    if (this.shouldLog('error')) {
      console.error(...this.format('error', args));
    }
  }

  warn(...args) {
    if (this.shouldLog('warn')) {
      console.warn(...this.format('warn', args));
    }
  }

  info(...args) {
    if (this.shouldLog('info')) {
      console.info(...this.format('info', args));
    }
  }

  debug(...args) {
    if (this.shouldLog('debug')) {
      console.debug(...this.format('debug', args));
    }
  }
}

/** Singleton logger instance used by the SDK. */
const log = new Logger({ level: 'error', prefix: 'Monstera' });

export { LEVELS, Logger, log };
export default log;
