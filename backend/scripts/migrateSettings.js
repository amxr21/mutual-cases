/**
 * Migration: create the `settings` key/value store that backs the admin
 * Settings module (store profile, region/currency, VAT/TRN, customization,
 * notification templates, etc.). One row per setting key; value stored as JSON
 * text so any setting (string, number, object) round-trips cleanly.
 *
 * Idempotent: CREATE TABLE IF NOT EXISTS + per-key INSERT IGNORE for defaults.
 *
 * Run: node scripts/migrateSettings.js
 */
const { query, pool } = require("../dbClient");

// Sensible defaults so the Settings UI has values to show on first load. These
// are the seeds for later phases (VAT/region/currency) but only 'customization'
// is wired into the UI in Phase 0.
const DEFAULTS = {
    customization: { adminFont: "system" },
    store_profile: { name: "Mutual", logoUrl: "", trn: "", email: "", phone: "" },
    region: { baseCurrency: "AED", defaultCountry: "AE" },
    vat: { enabled: true, rate: 5, inclusive: true },
    theme: { mode: "light", accent: "#055AB0" },
    // Storefront-facing flags (publicly readable via /settings/public).
    storefront: { locationAutodetect: false },
};

const main = async () => {
    await query(
        `CREATE TABLE IF NOT EXISTS settings (
            \`key\` varchar(64) NOT NULL,
            \`value\` json NOT NULL,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
    console.log("✓ settings table ready");

    for (const [key, value] of Object.entries(DEFAULTS)) {
        const res = await query(
            "INSERT IGNORE INTO settings (`key`, `value`) VALUES (?, CAST(? AS JSON))",
            [key, JSON.stringify(value)]
        );
        console.log(`${res.affectedRows ? "✓ seeded" : "• kept existing"} ${key}`);
    }

    console.log("Settings migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
