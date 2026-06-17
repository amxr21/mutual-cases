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
const fs = require("fs");
const mysql = require("mysql2/promise");
const config = require("./config");

/**
 * Build the mysql2 `ssl` option.
 *   - Returns `undefined` (no TLS) unless DB_SSL=true, so local dev is unaffected.
 *   - When a CA bundle path is given (DB_SSL_CA, e.g. the AWS RDS global CA), it's
 *     read and supplied so the server certificate can be properly verified.
 */
function buildSslConfig() {
    if (!config.db.ssl) return undefined;
    const ssl = { rejectUnauthorized: config.db.sslRejectUnauthorized };
    if (config.db.sslCaPath) {
        try {
            ssl.ca = fs.readFileSync(config.db.sslCaPath, "utf8");
        } catch (err) {
            // Fail loudly: a missing CA when verification is on would silently
            // break every connection, so surface it at startup instead.
            throw new Error(`Could not read DB_SSL_CA at "${config.db.sslCaPath}": ${err.message}`);
        }
    }
    return ssl;
}

const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
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
    ssl: buildSslConfig(),
    typeCast: (field, next) => {
        // Map TINYINT(1) -> boolean.
        if (field.type === "TINY" && field.length === 1) {
            return field.string() === "1";
        }
        return next();
    },
});

module.exports = pool;
