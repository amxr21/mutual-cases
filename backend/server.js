const config = require("./config");
const logger = require("./logger");
const createApp = require("./app");
const registerProcessHandlers = require("./process/handlers");

// --- Fail fast on missing critical configuration --------------------------
const missingEnv = config.validate();
if (missingEnv.length) {
    logger.error("Missing required environment variables", { missing: missingEnv });
    // Without DB creds / JWT secret the app can't function; refuse to start.
    process.exit(1);
}

const app = createApp();

const server = app.listen(config.server.port, () => {
    logger.info(`Server listening on port ${config.server.port}`, { env: config.env });
});

// Process-level safety net + graceful shutdown (drains server + DB pool).
registerProcessHandlers({ server, pool: require("./db") });

module.exports = app;
