/**
 * MySQL connection pool.
 *
 * Configuration is sourced from the central config module (env-driven). Notable
 * hardening vs. the original:
 *   - multipleStatements defaults to FALSE (was true) — removes the stacked-query
 *     amplifier for SQL injection. Re-enable only via DB_MULTIPLE_STATEMENTS=true.
 *   - SSL cert validation is env-gated (DB_SSL_REJECT_UNAUTHORIZED).
 *   - enableKeepAlive keeps pooled sockets healthy across idle periods.
 *
 * Prefer the helpers in ./db/index.js (query / withTransaction) over using this
 * pool directly, so DB errors are logged and mapped consistently.
 */
const mysql = require("mysql2/promise");
const config = require("./config");

const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit,
    queueLimit: config.db.queueLimit,
    decimalNumbers: true,
    multipleStatements: config.db.multipleStatements,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: { rejectUnauthorized: config.db.sslRejectUnauthorized },
    typeCast: (field, next) => {
        // Map TINYINT(1) -> boolean.
        if (field.type === "TINY" && field.length === 1) {
            return field.string() === "1";
        }
        return next();
    },
});

module.exports = pool;
