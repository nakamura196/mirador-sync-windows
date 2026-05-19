// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: [
    '<rootDir>/setupJest.js',
  ],
  // Transform Mirador's ESM build (and the react-dnd family) instead of
  // ignoring it. The allowlist also accepts pnpm's `.pnpm/` store path and the
  // scoped `@nakamura196/mirador` fork, which the previous pattern missed.
  transformIgnorePatterns: [
    'node_modules/(?!\\.pnpm/|@nakamura196/mirador|mirador|d3-delaunay|delaunator|robust-predicates|@react-dnd|react-dnd|dnd-core|react-dnd-html5-backend|dnd-multi-backend|rdndmb-html5-to-touch)',
  ],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: [
    "<rootDir>/__tests__/test-utils.js",
  ],
};
