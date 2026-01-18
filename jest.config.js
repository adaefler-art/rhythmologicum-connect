module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx', '**/?(*.)+(spec|test).ts', '**/?(*.)+(spec|test).tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^rhythm-core$': '<rootDir>/packages/rhythm-core/src/index.ts',
    '^rhythm-core/(.*)$': '<rootDir>/packages/rhythm-core/src/$1',
    '^server-only$': '<rootDir>/test/__mocks__/server-only.ts',
    '^react-markdown$': '<rootDir>/test/__mocks__/react-markdown.tsx',
    '^remark-gfm$': '<rootDir>/test/__mocks__/remark-gfm.ts',
    '^next/link$': '<rootDir>/test/__mocks__/next/link.tsx',
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    'lib/**/*.tsx',
    'app/api/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
}
