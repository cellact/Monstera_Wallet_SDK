/**
 * Jest configuration for ES Modules
 */

export default {
  // Use Node environment
  testEnvironment: 'node',
  
  // Module name mapping for ES modules (remove .js extension in imports)
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js' // Entry point, usually not tested directly
  ],
  
  // Coverage thresholds (optional, adjust as needed)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};

