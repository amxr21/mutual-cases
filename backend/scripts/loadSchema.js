/**
 * Load schema.sql through the app's own MySQL pool.
 *
 * Exists because a deployed container (Nixpacks image) has no `mysql` client to
 * pipe the file into, and the pool runs with multipleStatements disabled — an
 * SQL-injection guard, see db.js — so the file can't be sent as one blob
 * either. This splits it and executes statement by statement.
 *
 * Idempotent: "table already exists" is treated as success, so re-running
 * against a partially-created database fills in only what's missing.
 *
 * Run (from backend/):  node scripts/loadSchema.js
 * Preview only:         node scripts/loadSchema.js --dry-run
 */
const fs = require("fs");
const path = require("path");

const config = require("../config");
const { query, pool } = require("../dbClient");

const dryRun = process.argv.includes("--dry-run");

/**
 * Split schema.sql into individual statements.
 *
 * schema.sql holds only plain CREATE TABLE statements and `--` comments — no
 * stored routines, triggers, or DELIMITER blocks, and no string literals
 * containing semicolons — so stripping comments and splitting on ';' is
 * sufficient. This would NOT be safe for a dump containing routines.
 */
const splitStatements = (sql) =>
    sql
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);

const main = async () => {
    const schemaPath = path.join(__dirname, "..", "schema.sql");
    if (!fs.existsSync(schemaPath)) {
        throw new Error(`schema.sql not found at ${schemaPath}`);
    }

    const statements = splitStatements(fs.readFileSync(schemaPath, "utf8"));
    const nameOf = (s) => (s.match(/CREATE TABLE\s+`?(\w+)`?/i) || [])[1] || "statement";

    console.log(`\nSchema load → ${config.db.user}@${config.db.host}:${config.db.port}/${config.db.name}`);
    console.log(`${statements.length} statements in schema.sql\n`);

    if (dryRun) {
        statements.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${nameOf(s)}`));
        console.log("\nDry run — nothing was written.\n");
        return;
    }

    let created = 0;
    let existed = 0;

    for (const statement of statements) {
        const name = nameOf(statement);
        try {
            await query(statement);
            created++;
            console.log(`  ✓ created ${name}`);
        } catch (err) {
            // Re-running against an already-created database is supported.
            if (err.code === "CONFLICT" || /already exists/i.test(err.message)) {
                existed++;
                console.log(`  • ${name} already exists`);
                continue;
            }
            throw new Error(`failed on ${name}: ${err.message}`);
        }
    }

    console.log(`\nDone. Created ${created}, already present ${existed}.`);
    console.log("Next: run the migration scripts, then seed.\n");
};

main()
    .then(async () => {
        await pool.end();
        process.exit(0);
    })
    .catch(async (err) => {
        console.error(`\nSchema load failed: ${err.message}\n`);
        await pool.end().catch(() => {});
        process.exit(1);
    });
