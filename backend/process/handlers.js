/**
 * Process-level safety net.
 *
 * Logs uncaughtException / unhandledRejection through the file logger before
 * the process is allowed to exit, and wires graceful shutdown on SIGINT/SIGTERM
 * so the server stops accepting connections and the DB pool drains cleanly.
 *
 * An uncaught exception leaves the process in an undefined state, so the correct
 * behavior is: log it, then exit and let the process manager restart us. We give
 * the logger a brief window to flush its file streams first.
 */
const logger = require("../logger");

let registered = false;

/**
 * @param {object} deps
 * @param {import("http").Server} [deps.server]  http server to close on shutdown
 * @param {{ end: () => Promise<void> }} [deps.pool]  DB pool to drain on shutdown
 */
const registerProcessHandlers = ({ server, pool } = {}) => {
    if (registered) return;
    registered = true;

    const flushAndExit = (code) => {
        // Give winston's file transports a moment to flush, then hard-exit.
        setTimeout(() => process.exit(code), 500);
    };

    process.on("uncaughtException", (err) => {
        logger.error("uncaughtException", { stack: err?.stack, message: err?.message });
        flushAndExit(1);
    });

    process.on("unhandledRejection", (reason) => {
        const err = reason instanceof Error ? reason : new Error(String(reason));
        logger.error("unhandledRejection", { stack: err.stack, message: err.message });
        flushAndExit(1);
    });

    const shutdown = async (signal) => {
        logger.info(`Received ${signal}, shutting down gracefully`);
        try {
            if (server) {
                await new Promise((resolve) => server.close(resolve));
            }
            if (pool?.end) {
                await pool.end();
            }
            logger.info("Shutdown complete");
            flushAndExit(0);
        } catch (err) {
            logger.error("Error during shutdown", { stack: err?.stack, message: err?.message });
            flushAndExit(1);
        }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
};

module.exports = registerProcessHandlers;
