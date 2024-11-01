// jest.config.js
module.exports = {
    collectCoverage: true,
    collectCoverageFrom: [
      "models/**/*.js",
      "routes/**/*.js",
      "tests/**/*.test.js",
      "!**/node_modules/**",
      "!**/coverage/**"
    ],
    coverageDirectory: "coverage",
    testEnvironment: "node",
  };
  