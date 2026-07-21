/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  // CLI behavior is exercised via spawned-process integration tests; these files
  // scope instrumentation coverage to directly imported unit-tested modules.
  collectCoverageFrom: ['src/cli/options.ts', 'src/cli/validators.ts'],
  coverageThreshold: {
    global: {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
  },
  coverageReporters: ['text', 'cobertura'],
};
