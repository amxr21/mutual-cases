/**
 * Settings controllers — read/update the admin settings key/value store.
 *
 * Each setting is one row keyed by a short string, with a JSON value. Keys are
 * restricted to a known allowlist (ALLOWED_KEYS) so the store can't be polluted
 * with arbitrary keys. Values are validated per-key by the route's Zod schema
 * before reaching these handlers; here we just persist/return them.
 *
 * Mounted behind requireAdmin in adminRoutes.
 */
const { query } = require("../dbClient");
const { badRequest, notFound } = require("../errors/AppError");
const { audit } = require("../audit");

// Keys the Settings module knows about. Extend this as later phases add panels
// (e.g. payments, shipping, notification templates).
const ALLOWED_KEYS = new Set([
    "customization",
    "store_profile",
    "region",
    "vat",
    "theme",
    "storefront",
]);

/** Parse a JSON column value that may already be an object (mysql2 JSON type). */
const parseValue = (v) => {
    if (v == null) return null;
    if (typeof v === "object") return v;
    try { return JSON.parse(v); } catch { return v; }
};

/** GET /admin/settings — all settings as a { key: value } map. */
const getAllSettings = async (_req, res) => {
    const rows = await query("SELECT `key`, `value` FROM settings", [], { op: "settings.getAll" });
    const out = {};
    for (const r of rows) out[r.key] = parseValue(r.value);
    res.json(out);
};

/** GET /admin/settings/:key — a single setting's value. */
const getSetting = async (req, res) => {
    const key = req.params.key;
    if (!ALLOWED_KEYS.has(key)) throw badRequest("Unknown setting key");
    const rows = await query("SELECT `value` FROM settings WHERE `key` = ?", [key], {
        op: "settings.getOne",
    });
    if (!rows.length) throw notFound("Setting not found");
    res.json({ key, value: parseValue(rows[0].value) });
};

/** PUT /admin/settings/:key — upsert a single setting's value. */
const updateSetting = async (req, res) => {
    const key = req.params.key;
    if (!ALLOWED_KEYS.has(key)) throw badRequest("Unknown setting key");
    // The route schema has already validated/shaped req.body.value.
    const value = req.body.value;

    await query(
        `INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`,
        [key, JSON.stringify(value)],
        { op: "settings.update" }
    );
    await audit(req, "settings.update", { entity: "setting", entityId: key, detail: key });
    res.json({ key, value });
};

/**
 * GET /settings/public — a small, PUBLIC subset of settings the storefront needs
 * (no auth). Only safe flags are exposed; never secrets. Currently surfaces the
 * 'storefront' settings (e.g. locationAutodetect).
 */
const getPublicSettings = async (_req, res) => {
    const rows = await query("SELECT `value` FROM settings WHERE `key` = 'storefront'", [], {
        op: "settings.getPublic",
    });
    const sf = rows.length ? parseValue(rows[0].value) : {};
    res.json({
        locationAutodetect: !!(sf && sf.locationAutodetect),
    });
};

module.exports = { getAllSettings, getSetting, updateSetting, getPublicSettings, ALLOWED_KEYS };
