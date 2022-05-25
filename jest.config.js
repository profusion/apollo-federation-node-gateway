/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/bin/',
    '[.]config[.]js$',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleNameMapper: {
    '^lib/(.*)$': '<rootDir>/lib/$1',
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
};
