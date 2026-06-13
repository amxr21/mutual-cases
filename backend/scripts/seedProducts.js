/**
 * Seed script — inserts a batch of varied sample products across all three
 * categories with seeded Picsum images (stable per product).
 *
 * Run:  node scripts/seedProducts.js [count]
 * Default count = 50. Safe to re-run: it skips combos that already exist (the
 * products table has a unique key on price+model+edition+category+type_id).
 *
 * Images use https://picsum.photos/seed/<seed>/<w>/<h> so each product keeps a
 * consistent random photo.
 */
const { withTransaction, query } = require("../dbClient");

const CATEGORIES = {
    iphone: {
        models: ["13", "13 pro", "13 pro max", "14", "14 plus", "14 pro", "15", "15 pro", "15 pro max", "16", "16 pro", "16 pro max"],
        types: ["normal", "3d design", "simple", "light", "magnet"],
    },
    ipad: {
        models: ["m1", "m2", "m3", "m4", "m5", "m6", "air", "mini", "pro 11", "pro 13"],
        types: ["simple", "light", "magnet"],
    },
    "special items": {
        models: ["sticker pack", "seasonal", "ramadan", "national day", "eid"],
        types: ["normal", "3d design"],
    },
};

const EDITIONS = [
    "abu dhabi edition", "dubai edition", "sharjah edition", "ajman edition",
    "uaq edition", "fujairah edition", "ras al khaimah edition", "dark matte edition",
    "desert gold edition", "pearl edition", "falcon edition", "oasis edition",
];

const TYPE_IDS = { normal: 1, "3d design": 2, simple: 3, light: 4, magnet: 5 };
const CATEGORY_IDS = { ipad: 1, iphone: 2, "special items": 3 };

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Resolve (or create) a lookup id, parameterized. */
const resolveId = async (tx, table, column, value, staticMap) => {
    const val = String(value).toLowerCase();
    if (staticMap && staticMap[val]) return staticMap[val];
    const rows = await tx(`SELECT id FROM \`${table}\` WHERE \`${column}\` = ?`, [val]);
    if (rows.length) return rows[0].id;
    const result = await tx(`INSERT INTO \`${table}\` (\`${column}\`) VALUES (?)`, [val]);
    return result.insertId;
};

const seedOne = async (category, model, type, edition, price, trend) =>
    withTransaction(async (tx) => {
        const stockId = randInt(10000, 999999);
        const typeId = await resolveId(tx, "types", "type", type, TYPE_IDS);

        const seed = `${category}-${model}-${edition}-${type}`.replace(/\s+/g, "-");
        const img = (n) => `https://picsum.photos/seed/${encodeURIComponent(seed + "-" + n)}/600/600`;

        const result = await tx(
            `INSERT INTO products
                (trend, price, model, edition, category, stock_quantity_id, type_id, image_url_1, image_url_2, image_url_3)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [trend, price, model, edition, category, stockId, typeId, img(1), img(2), img(3)]
        );

        const editionId = await resolveId(tx, "edition", "edition_design", edition);
        const modelId = await resolveId(tx, "model", "model_type", model);
        const categoryId = await resolveId(tx, "category", "category_title", category, CATEGORY_IDS);

        await tx(
            `INSERT INTO stock_quantity (edition_id, model_id, category_id, quantity, stock_id)
             VALUES (?, ?, ?, ?, ?)`,
            [editionId, modelId, categoryId, randInt(0, 50), stockId]
        );

        return result.insertId;
    }, { op: "seedOne" });

const main = async () => {
    const target = parseInt(process.argv[2], 10) || 50;
    const before = await query("SELECT COUNT(*) AS c FROM products");
    console.log(`Products before: ${before[0].c}. Seeding up to ${target} new...`);

    const catNames = Object.keys(CATEGORIES);
    let inserted = 0;
    let attempts = 0;
    const maxAttempts = target * 5;

    while (inserted < target && attempts < maxAttempts) {
        attempts++;
        const category = pick(catNames);
        const { models, types } = CATEGORIES[category];
        const model = pick(models);
        const type = pick(types);
        const edition = pick(EDITIONS);
        const price = randInt(80, 220);
        const trend = Math.random() < 0.25 ? 1 : 0;

        try {
            await seedOne(category, model, type, edition, price, trend);
            inserted++;
            if (inserted % 10 === 0) console.log(`  ...${inserted} inserted`);
        } catch (err) {
            // Duplicate combo (unique_product_row) -> skip and try another.
            if (err.code === "CONFLICT" || /duplicate|exists/i.test(err.message)) continue;
            console.error("  insert error:", err.message);
        }
    }

    const after = await query("SELECT COUNT(*) AS c FROM products");
    console.log(`Done. Inserted ${inserted} (attempts: ${attempts}). Products now: ${after[0].c}.`);
    process.exit(0);
};

main().catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
});
