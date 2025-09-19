import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/services/(.*)$': '<rootDir>/services/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'app/**/*.(ts|tsx)',
    'components/**/*.(ts|tsx)',
    'lib/**/*.(ts|tsx)',
    'hooks/**/*.(ts|tsx)',
    'services/**/*.(ts|tsx)',
    '!**/*.d.ts',
    '!**/layout.tsx',
    '!**/page.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
};

export default config;