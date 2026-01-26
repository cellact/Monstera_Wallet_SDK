/**
 * Mock utilities for testing
 */

/**
 * Sets up console.warn mocking and returns an object with:
 * - warnCalls: array of all warn call arguments
 * - restore: function to restore original console.warn
 * @returns {Object} Mock object with warnCalls array and restore function
 */
export function setupConsoleWarnMock() {
  const originalWarn = console.warn;
  const warnCalls = [];
  
  console.warn = (...args) => {
    warnCalls.push(args);
    originalWarn(...args);
  };
  
  return {
    warnCalls,
    restore: () => {
      console.warn = originalWarn;
    }
  };
}

