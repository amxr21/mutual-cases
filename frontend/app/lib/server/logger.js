/**
 * Frontend SERVER-SIDE logger (Winston + daily rotation).
 *
 * IMPORTANT: import this only from server-side code (route handlers). It uses
 * Node's fs and must never be bundled into a client component.
 *
 * Writes client-originated error reports to:
 *   <frontend>/logs/client-error-YYYY-MM-DD.log
 *
 * Each entry carries: timestamp, level, message, stack, and client context
 * (pathname, component, userAgent, source) where available.
 */

import fs from "fs";
import winston from "winston";
import "winston-daily-rotate-file";

import { serverConfig } from "../config";

const { dir, level, datePattern, maxSize, maxFiles, zippedArchive, console: useConsole } =
    serverConfig.logging;

// Ensure the log directory exists.
fs.mkdirSync(dir, { recursive: true });

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.json()
);

const transports = [
    new winston.transports.DailyRotateFile({
        level: "error",
        dirname: dir,
        filename: "client-error-%DATE%.log",
        datePattern,
        maxSize,
        maxFiles,
        zippedArchive,
        format: fileFormat,
    }),
];

if (useConsole) {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: "HH:mm:ss" }),
                winston.format.printf((info) => {
                    const { timestamp, level: lvl, message, ...rest } = info;
                    const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
                    return `${timestamp} ${lvl} [client] ${message}${extra}`;
                })
            ),
        })
    );
}

// Use a module-level singleton so Next's dev hot-reload doesn't stack transports.
const globalForLogger = globalThis;
const clientLogger =
    globalForLogger.__mutualClientLogger ||
    winston.createLogger({ level, transports, exitOnError: false });

if (!globalForLogger.__mutualClientLogger) {
    globalForLogger.__mutualClientLogger = clientLogger;
}

export default clientLogger;
