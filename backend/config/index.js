/**
 * Centralized, env-driven configuration for the backend.
 *
 * Nothing in the app should read process.env directly (outside this file and
 * db.js bootstrapping). Everything funnels through here so defaults, types,
 * and required-variable validation live in one place.
 */

require("dotenv").config();

const path = require("path");

/** Parse a boolean-ish env var ("true"/"1"/"yes" => true). */
const bool = (val, fallback = false) => {
    if (val === undefined || val === null || val === "") return fallback;
    return ["1", "true", "yes", "on"].includes(String(val).toLowerCase());
};

/** Parse an integer env var with a fallback. */
const int = (val, fallback) => {
    const n = parseInt(val, 10);
    return Number.isFinite(n) ? n : fallback;
};

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

const config = {
    env: NODE_ENV,
    isProduction,
    isDevelopment: NODE_ENV === "development",

    server: {
        port: int(process.env.PORT, 3000),
        // Comma-separated list in env, e.g. "http://localhost:3000,https://foo.com"
        allowedOrigins: (process.env.ALLOWED_ORIGINS ||
            "http://localhost:3000,http://localhost:3001,https://mutual-cases.vercel.app,https://mutual-cases.onrender.com")
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean),
    },

    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
        connectionLimit: int(process.env.DB_CONNECTION_LIMIT, 25),
        queueLimit: int(process.env.DB_QUEUE_LIMIT, 100),
        // SSL cert validation. Off by default (managed dev DBs often use
        // self-signed certs); turn on in production via DB_SSL_REJECT_UNAUTHORIZED=true.
        sslRejectUnauthorized: bool(process.env.DB_SSL_REJECT_UNAUTHORIZED, false),
        // Stacked queries are a SQL-injection amplifier; disabled unless explicitly enabled.
        multipleStatements: bool(process.env.DB_MULTIPLE_STATEMENTS, false),
    },

    auth: {
        googleClientId: process.env.GOOGLE_CLIENT_ID,
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
        // Upper bound (ms) for the outbound Google token-verification call.
        googleVerifyTimeoutMs: int(process.env.GOOGLE_VERIFY_TIMEOUT_MS, 8000),
    },

    logging: {
        // error | warn | info | http | debug
        level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
        dir: process.env.LOG_DIR
            ? path.resolve(process.env.LOG_DIR)
            : path.join(__dirname, "..", "logs"),
        // Daily rotation pattern + retention.
        datePattern: process.env.LOG_DATE_PATTERN || "YYYY-MM-DD",
        maxSize: process.env.LOG_MAX_SIZE || "20m",
        maxFiles: process.env.LOG_MAX_FILES || "14d",
        zippedArchive: bool(process.env.LOG_ZIPPED_ARCHIVE, false),
        // Console transport is on in dev, off in prod by default (file logging always on).
        console: bool(process.env.LOG_CONSOLE, !isProduction),
    },
};

/**
 * Fail fast on missing critical env vars rather than crashing deep in a request.
 * Returns the list of missing keys (empty if all present).
 */
const REQUIRED = [
    ["DB_HOST", config.db.host],
    ["DB_USER", config.db.user],
    ["DB_NAME", config.db.name],
    ["GOOGLE_CLIENT_ID", config.auth.googleClientId],
    ["JWT_SECRET", config.auth.jwtSecret],
];

config.validate = () => {
    const missing = REQUIRED.filter(([, value]) => value === undefined || value === "")
        .map(([key]) => key);
    return missing;
};

module.exports = config;
