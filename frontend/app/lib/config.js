/**
 * Frontend configuration — env-driven, no hardcoded values.
 *
 * Split into:
 *   - public:  NEXT_PUBLIC_* values safe to ship to the browser.
 *   - server:  values read only in server-side code (route handlers, logger).
 *
 * Import `publicConfig` from client components and `serverConfig` only from
 * server-side modules (route handlers / the logger).
 */

import path from "path";

export const publicConfig = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "",
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    // Where the browser POSTs client-side error reports.
    clientLogEndpoint: process.env.NEXT_PUBLIC_CLIENT_LOG_ENDPOINT || "/api/client-log",
    // Toggle client error reporting (on by default).
    clientLoggingEnabled:
        (process.env.NEXT_PUBLIC_CLIENT_LOGGING_ENABLED ?? "true").toLowerCase() !== "false",
};

const bool = (val, fallback) => {
    if (val === undefined || val === null || val === "") return fallback;
    return ["1", "true", "yes", "on"].includes(String(val).toLowerCase());
};

const isProduction = process.env.NODE_ENV === "production";

export const serverConfig = {
    isProduction,
    logging: {
        level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
        dir: process.env.FRONTEND_LOG_DIR
            ? path.resolve(process.env.FRONTEND_LOG_DIR)
            : path.join(process.cwd(), "logs"),
        datePattern: process.env.LOG_DATE_PATTERN || "YYYY-MM-DD",
        maxSize: process.env.LOG_MAX_SIZE || "20m",
        maxFiles: process.env.LOG_MAX_FILES || "14d",
        zippedArchive: bool(process.env.LOG_ZIPPED_ARCHIVE, false),
        console: bool(process.env.LOG_CONSOLE, !isProduction),
    },
};
