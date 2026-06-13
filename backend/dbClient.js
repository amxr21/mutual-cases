/**
 * Database access helpers (wraps the pool in ./db.js).
 *
 * Everything that touches the DB should go through `query` or `withTransaction`
 * so that:
 *   - failures are logged to db-*.log with the offending SQL + code,
 *   - MySQL driver errors are mapped to client-safe AppErrors (e.g. duplicate
 *     key -> 409 CONFLICT) instead of leaking raw error objects,
 *   - multi-statement writes run atomically with automatic rollback.
 *
 * NOTE: callers must still use parameterized queries (`?` placeholders). These
 * helpers do not and cannot sanitize string-interpolated SQL.
 */
const pool = require("./db");
const logger = require("./logger");
const {
    AppError,
    conflict,
    badRequest,
    serviceUnavailable,
    internal,
} = require("./errors/AppError");

/** Map a raw mysql2 error to an AppError with a safe message. */
const mapDbError = (err, context) => {
    // Log full detail server-side (db channel + error file).
    logger.db("error", "query failed", {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        sql: context?.sql,
        op: context?.op,
    });

    switch (err.code) {
        case "ER_DUP_ENTRY":
            return conflict("That record already exists");
        case "ER_NO_REFERENCED_ROW":
        case "ER_NO_REFERENCED_ROW_2":
            return badRequest("Referenced record does not exist");
        case "ER_ROW_IS_REFERENCED":
        case "ER_ROW_IS_REFERENCED_2":
            return conflict("That record is still referenced by other data");
        case "ER_DATA_TOO_LONG":
        case "ER_BAD_NULL_ERROR":
        case "WARN_DATA_TRUNCATED":
            return badRequest("Invalid data for one or more fields");
        case "PROTOCOL_CONNECTION_LOST":
        case "ECONNREFUSED":
        case "ETIMEDOUT":
        case "ER_CON_COUNT_ERROR":
            return serviceUnavailable("Database is temporarily unavailable", err);
        default:
            // Unknown DB error -> generic 500, original kept as cause (server-side only).
            return internal("A database error occurred", err);
    }
};

/**
 * Run a parameterized query. Returns the rows array (first element of the
 * mysql2 tuple). Throws an AppError on failure.
 *
 * @param {string} sql
 * @param {Array<unknown>} [params]
 * @param {{ op?: string }} [meta] optional label for logging
 */
const query = async (sql, params = [], meta = {}) => {
    try {
        const [rows] = await pool.query(sql, params);
        return rows;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw mapDbError(err, { sql, op: meta.op });
    }
};

/**
 * Run `work` inside a transaction on a dedicated connection. Commits on success,
 * rolls back on any throw, and always releases the connection. The callback
 * receives a `tx(sql, params)` function bound to the transactional connection.
 *
 *   await withTransaction(async (tx) => {
 *     const r = await tx("INSERT INTO products (...) VALUES (?)", [..]);
 *     await tx("INSERT INTO stock_quantity (...) VALUES (?)", [..]);
 *     return r.insertId;
 *   });
 */
const withTransaction = async (work, meta = {}) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const tx = async (sql, params = []) => {
            try {
                const [rows] = await conn.query(sql, params);
                return rows;
            } catch (err) {
                if (err instanceof AppError) throw err;
                throw mapDbError(err, { sql, op: meta.op });
            }
        };

        const result = await work(tx);
        await conn.commit();
        return result;
    } catch (err) {
        try {
            await conn.rollback();
            logger.db("warn", "transaction rolled back", { op: meta.op });
        } catch (rollbackErr) {
            logger.db("error", "rollback failed", {
                op: meta.op,
                message: rollbackErr?.message,
            });
        }
        if (err instanceof AppError) throw err;
        throw mapDbError(err, { op: meta.op });
    } finally {
        conn.release();
    }
};

/** Lightweight connectivity check for startup/health endpoints. */
const ping = async () => {
    await pool.query("SELECT 1");
    return true;
};

module.exports = { query, withTransaction, ping, pool };
