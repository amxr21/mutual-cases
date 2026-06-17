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
        port: int(process.env.DB_PORT, 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
        connectionLimit: int(process.env.DB_CONNECTION_LIMIT, 25),
        queueLimit: int(process.env.DB_QUEUE_LIMIT, 100),
        // TLS for the DB connection.
        //   DB_SSL=true                       -> connect over TLS (required for AWS RDS public)
        //   DB_SSL_REJECT_UNAUTHORIZED=true   -> verify the server cert (recommended in prod)
        //   DB_SSL_CA=/path/to/rds-ca.pem     -> CA bundle used to verify (AWS RDS global CA)
        // For a public RDS instance set DB_SSL=true, DB_SSL_REJECT_UNAUTHORIZED=true,
        // and point DB_SSL_CA at the downloaded AWS RDS CA bundle.
        ssl: bool(process.env.DB_SSL, false),
        sslRejectUnauthorized: bool(process.env.DB_SSL_REJECT_UNAUTHORIZED, false),
        sslCaPath: process.env.DB_SSL_CA || "",
        // Stacked queries are a SQL-injection amplifier; disabled unless explicitly enabled.
        multipleStatements: bool(process.env.DB_MULTIPLE_STATEMENTS, false),
    },

    email: {
        // Resend integration. When apiKey is absent the mailer logs "would send"
        // instead of sending, so the app works in dev without a key.
        resendApiKey: process.env.RESEND_API_KEY || "",
        from: process.env.EMAIL_FROM || "Mutual <onboarding@resend.dev>",
        // Public base URL of the storefront, for links inside emails.
        siteUrl: process.env.PUBLIC_SITE_URL || "http://localhost:3001",
        enabled: !!process.env.RESEND_API_KEY,
    },

    // Cloudinary image uploads (logo, later product images). When cloudName +
    // apiKey + apiSecret are all set, the upload signing endpoint is active;
    // otherwise the API reports "not configured" and the UI falls back to a URL.
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
        apiKey: process.env.CLOUDINARY_API_KEY || "",
        apiSecret: process.env.CLOUDINARY_API_SECRET || "",
        uploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || "mutual",
        get enabled() {
            return !!(this.cloudName && this.apiKey && this.apiSecret);
        },
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
