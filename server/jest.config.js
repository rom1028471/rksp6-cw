module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/migrations/**',
    '!src/config/**'
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
}; 