/**
 * API request/response logger -> api-*.log.
 *
 * Logs one record per request on response finish, capturing method, route,
 * status, latency, and best-effort user id. Replaces the ad-hoc console.log
 * that previously sat in server.js. Never logs request bodies (avoids leaking
 * PII / secrets into the api log).
 */
const logger = require("../logger");

const requestLogger = (req, res, next) => {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const latencyMs = Number(process.hrtime.bigint() - start) / 1e6;
        logger.api({
            level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
            message: "request",
            method: req.method,
            route: req.originalUrl,
            status: res.statusCode,
            latencyMs: Math.round(latencyMs * 100) / 100,
            // req.user is set by auth middleware when present; safe-optional here.
            userId: req.user?.id,
            ip: req.ip,
        });
    });

    next();
};

module.exports = requestLogger;
