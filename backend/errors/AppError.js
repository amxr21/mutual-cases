/**
 * AppError — the single error type the app throws on purpose.
 *
 * Carries an HTTP status, a stable machine-readable `code`, a client-safe
 * `message`, and optional `details` (e.g. validation field errors). The error
 * middleware uses `isOperational` to decide whether a message is safe to send
 * to the client (true) or must be masked as a generic 500 (false / unknown errors).
 */
class AppError extends Error {
    /**
     * @param {string} message  client-safe message
     * @param {object} [opts]
     * @param {number} [opts.status=500]
     * @param {string} [opts.code="INTERNAL_ERROR"]
     * @param {unknown} [opts.details]
     * @param {Error}  [opts.cause] original error (kept server-side only)
     */
    constructor(message, { status = 500, code = "INTERNAL_ERROR", details, cause } = {}) {
        super(message);
        this.name = "AppError";
        this.status = status;
        this.code = code;
        this.details = details;
        this.isOperational = true; // expected/handled error
        if (cause) this.cause = cause;
        Error.captureStackTrace(this, this.constructor);
    }
}

// --- Factory helpers for the common cases -------------------------------

const badRequest = (message = "Bad request", details) =>
    new AppError(message, { status: 400, code: "BAD_REQUEST", details });

const unauthorized = (message = "Authentication required") =>
    new AppError(message, { status: 401, code: "UNAUTHORIZED" });

const forbidden = (message = "You do not have permission to do that") =>
    new AppError(message, { status: 403, code: "FORBIDDEN" });

const notFound = (message = "Resource not found") =>
    new AppError(message, { status: 404, code: "NOT_FOUND" });

const conflict = (message = "That already exists", details) =>
    new AppError(message, { status: 409, code: "CONFLICT", details });

const validation = (message = "Validation failed", details) =>
    new AppError(message, { status: 422, code: "VALIDATION_ERROR", details });

const internal = (message = "Something went wrong", cause) =>
    new AppError(message, { status: 500, code: "INTERNAL_ERROR", cause });

const serviceUnavailable = (message = "Service temporarily unavailable", cause) =>
    new AppError(message, { status: 503, code: "SERVICE_UNAVAILABLE", cause });

module.exports = {
    AppError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    validation,
    internal,
    serviceUnavailable,
};
