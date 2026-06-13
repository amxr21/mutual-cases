/**
 * Backend logger (Winston + daily rotation).
 *
 * Writes three concern-separated, date-rotated files under config.logging.dir:
 *   - error-YYYY-MM-DD.log   all error-level entries (any source)
 *   - api-YYYY-MM-DD.log     request/response lifecycle (method, route, status, latency)
 *   - db-YYYY-MM-DD.log      query failures, transaction rollbacks, connection issues
 *
 * Console output mirrors everything in development (config.logging.console).
 * File logging runs in all environments.
 *
 * Channels:
 *   logger.error/warn/info/debug(...)  -> general + error file
 *   logger.api(meta)                   -> api file
 *   logger.db(level, message, meta)    -> db file (+ error file when level==='error')
 */

const fs = require("fs");
const path = require("path");
const winston = require("winston");
require("winston-daily-rotate-file");

const config = require("../config");

const { dir, level, datePattern, maxSize, maxFiles, zippedArchive, console: useConsole } =
    config.logging;

// Ensure the log directory exists before any transport opens a stream.
fs.mkdirSync(dir, { recursive: true });

const baseFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.errors({ stack: true }), // capture stack when an Error is passed
    winston.format.json()
);

const rotateOpts = (filenamePrefix, fileLevel) => ({
    level: fileLevel,
    dirname: dir,
    filename: `${filenamePrefix}-%DATE%.log`,
    datePattern,
    maxSize,
    maxFiles,
    zippedArchive,
    format: baseFormat,
});

// --- Transports -----------------------------------------------------------

// error-*.log: only error level, regardless of channel.
const errorTransport = new winston.transports.DailyRotateFile(
    rotateOpts("error", "error")
);

// api-*.log: tagged with channel 'api'.
const apiTransport = new winston.transports.DailyRotateFile({
    ...rotateOpts("api", level),
    // Only let entries explicitly tagged channel:'api' through.
    format: winston.format.combine(
        winston.format((info) => (info.channel === "api" ? info : false))(),
        baseFormat
    ),
});

// db-*.log: tagged with channel 'db'.
const dbTransport = new winston.transports.DailyRotateFile({
    ...rotateOpts("db", level),
    format: winston.format.combine(
        winston.format((info) => (info.channel === "db" ? info : false))(),
        baseFormat
    ),
});

const transports = [errorTransport, apiTransport, dbTransport];

if (useConsole) {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: "HH:mm:ss" }),
                winston.format.printf((info) => {
                    const { timestamp, level: lvl, message, channel, stack, ...rest } = info;
                    const tag = channel ? `[${channel}] ` : "";
                    const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
                    return `${timestamp} ${lvl} ${tag}${stack || message}${extra}`;
                })
            ),
        })
    );
}

const baseLogger = winston.createLogger({
    level,
    transports,
    // Never let a logging failure take down the process.
    exitOnError: false,
});

// --- Public API -----------------------------------------------------------

const logger = {
    error: (message, meta = {}) => baseLogger.error(message, meta),
    warn: (message, meta = {}) => baseLogger.warn(message, meta),
    info: (message, meta = {}) => baseLogger.info(message, meta),
    debug: (message, meta = {}) => baseLogger.debug(message, meta),

    /** Log an API request/response record to api-*.log. */
    api: (meta = {}) =>
        baseLogger.log({
            level: meta.level || "info",
            channel: "api",
            message: meta.message || "request",
            ...meta,
        }),

    /** Log a DB event to db-*.log (and error-*.log when level==='error'). */
    db: (level, message, meta = {}) =>
        baseLogger.log({ level, channel: "db", message, ...meta }),

    /** Raw winston instance for advanced needs. */
    raw: baseLogger,
};

module.exports = logger;
