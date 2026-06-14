/**
 * One-time backfill: populate description/material/approach/features for every
 * product, with values that vary by category + type so each detail page reads
 * realistically. Safe to re-run (only fills rows where the field is NULL/empty
 * unless --force is passed).
 *
 * Run: node scripts/backfillProductDetails.js [--force]
 */
const { query } = require("../dbClient");

const MATERIAL_BY_TYPE = {
    normal: "Impact-resistant polycarbonate with a soft-touch matte finish",
    "3d design": "Layered resin over polycarbonate with a raised 3D textured print",
    simple: "Slim flexible TPU with an anti-fingerprint coating",
    light: "Ultra-light aramid-fiber composite, barely-there feel",
    magnet: "Polycarbonate shell with built-in MagSafe-compatible magnet array",
};

const APPROACH_BY_CATEGORY = {
    iphone:
        "Precision-molded to the exact iPhone chassis, with raised camera and screen lips for drop protection and tactile, clicky button covers.",
    ipad:
        "Engineered for iPad with a fold-to-stand cover, precise port cutouts, and reinforced corners to absorb everyday knocks.",
    "special items":
        "A limited, handcrafted-feel piece designed around a seasonal theme — produced in small batches with extra attention to finish.",
};

const FEATURES_BASE = [
    "Raised edges protect screen & camera",
    "Slim, pocket-friendly profile",
    "Wireless-charging compatible",
    "Scratch- & fade-resistant print",
];

const EXTRA_FEATURE_BY_TYPE = {
    magnet: "Snaps securely to MagSafe chargers & mounts",
    light: "Among the lightest cases we make",
    "3d design": "Tactile 3D artwork you can feel",
    simple: "Minimal bulk, maximum grip",
    normal: "All-day everyday durability",
};

const editionLabel = (s) => String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());

const buildDescription = (p) => {
    const cat =
        p.category === "iphone" ? "iPhone" : p.category === "ipad" ? "iPad" : "Mutual";
    const edition = editionLabel(p.edition);
    return `The ${edition} ${cat} ${p.category === "special items" ? "piece" : "case"} blends ${p.type} styling with everyday durability. Designed in the UAE, it pairs a clean look with reliable, slim protection for your device.`;
};

const main = async () => {
    const force = process.argv.includes("--force");

    const products = await query(
        "SELECT p.id, p.category, p.edition, t.type AS type FROM products p JOIN types t ON t.id = p.type_id"
    );

    let updated = 0;
    for (const p of products) {
        const type = String(p.type || "normal").toLowerCase();
        const material = MATERIAL_BY_TYPE[type] || MATERIAL_BY_TYPE.normal;
        const approach = APPROACH_BY_CATEGORY[p.category] || APPROACH_BY_CATEGORY.iphone;
        const description = buildDescription(p);
        const features = [...FEATURES_BASE, EXTRA_FEATURE_BY_TYPE[type]]
            .filter(Boolean)
            .join(" | ");

        const setClause = force
            ? "description = ?, material = ?, approach = ?, features = ?"
            : `description = COALESCE(NULLIF(description,''), ?),
               material   = COALESCE(NULLIF(material,''), ?),
               approach   = COALESCE(NULLIF(approach,''), ?),
               features   = COALESCE(NULLIF(features,''), ?)`;

        await query(`UPDATE products SET ${setClause} WHERE id = ?`, [
            description,
            material,
            approach,
            features,
            p.id,
        ]);
        updated++;
    }

    console.log(`Backfilled ${updated} products (force=${force}).`);
    process.exit(0);
};

main().catch((e) => {
    console.error("Backfill failed:", e.message);
    process.exit(1);
});
