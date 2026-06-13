/**
 * 404 + centralized error-handling middleware.
 *
 * - notFoundHandler: any unmatched route becomes a clean 404 AppError.
 * - errorHandler: the single place that turns ANY error into a consistent JSON
 *   response shape and logs it with request context. Internal/unknown errors
 *   are masked as a generic 500 (no stack traces or SQL fragments to clients);
 *   the full detail still goes to the error log.
 *
 * Response shape (always):
 *   { error: { message, code, details? }, requestId }
 */
const logger = require("../logger");
const config = require("../config");
const { AppError, notFound } = require("../errors/AppError");

const notFoundHandler = (req, _res, next) => {
    next(notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars -- Express requires the 4-arg signature
const errorHandler = (err, req, res, _next) => {
    // Normalize to an AppError-ish shape.
    const isApp = err instanceof AppError;
    const status = isApp ? err.status : 500;
    const code = isApp ? err.code : "INTERNAL_ERROR";

    // Operational (expected) errors expose their message; everything else is masked.
    const clientMessage = isApp && err.isOperational ? err.message : "Something went wrong";
    const details = isApp ? err.details : undefined;

    // Log with full context. 5xx -> error level; 4xx -> warn.
    const logLevel = status >= 500 ? "error" : "warn";
    logger[logLevel === "error" ? "error" : "warn"](err.message || "Unhandled error", {
        code,
        status,
        method: req.method,
        route: req.originalUrl,
        userId: req.user?.id,
        ip: req.ip,
        stack: err.stack,
        cause: err.cause ? String(err.cause?.message || err.cause) : undefined,
        details,
    });

    const payload = {
        error: {
            message: clientMessage,
            code,
            ...(details ? { details } : {}),
        },
    };
    // Surface stack only in development to aid local debugging.
    if (config.isDevelopment && !(isApp && err.isOperational)) {
        payload.error.stack = err.stack;
    }

    res.status(status).json(payload);
};

module.exports = { notFoundHandler, errorHandler };
