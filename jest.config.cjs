/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // ── 커버리지 설정 ──────────────────────────────────────────────
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // ── 변환 설정 (CommonJS 강제) ──────────────────────────────────
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'node',
          esModuleInterop: true,
          strict: false,
          isolatedModules: false,
        },
      },
    ],
  },

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // ── 테스트 파일 경로 ───────────────────────────────────────────
  testMatch: ['**/tests/**/*.test.ts'],

  // ── 각 테스트 파일 격리 ────────────────────────────────────────
  clearMocks: true,
  restoreMocks: true,
};