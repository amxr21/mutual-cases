/**
 * Test env bootstrap — runs before the test framework loads modules.
 *
 * Sets the minimum env vars config.validate() requires so importing the app
 * (and config) doesn't fail or read a real .env. No real services are contacted;
 * the DB layer is mocked per-suite.
 */
process.env.NODE_ENV = "test";
process.env.DB_HOST = "localhost";
process.env.DB_USER = "test";
process.env.DB_NAME = "test";
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.JWT_SECRET = "test-secret-please-ignore";
process.env.LOG_CONSOLE = "false";
