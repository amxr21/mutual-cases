/**
 * Jest config for the backend.
 *
 * Tests run against the Express app built by app.js with the DB layer mocked
 * (see tests/helpers), so they're fast, offline, and never touch real data.
 */
module.exports = {
    testEnvironment: "node",
    setupFiles: ["<rootDir>/tests/setupEnv.js"],
    testMatch: ["<rootDir>/tests/**/*.test.js"],
    clearMocks: true,
    // The logger writes files; silence it during tests.
    silent: true,
};
