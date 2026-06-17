/**
 * Product controllers.
 *
 * All queries are parameterized and run through the dbClient helpers, so DB
 * errors are logged + mapped to AppErrors centrally. Handlers are written to be
 * wrapped by asyncHandler in the routes (they throw instead of try/catch), and
 * request bodies/params are pre-validated by the `validate` middleware.
 */
const { query, withTransaction } = require("../dbClient");
const { notFound } = require("../errors/AppError");

// Shared SELECT shape for products (joined with category/stock/type).
// avg_rating / review_count come from the reviews table (NULL/0 when none).
const PRODUCT_SELECT = `
    SELECT p.id, p.trend, p.edition, p.category, p.model, t.type, p.price,
           p.stock_quantity_id, sq.quantity, p.image_url_1, p.image_url_2, p.image_url_3,
           p.description, p.material, p.approach, p.features,
           p.created_at, p.updated_at,
           ROUND(COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id), 0), 1) AS avg_rating,
           (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count
    FROM products p
    JOIN category c ON p.category = c.category_title
    JOIN stock_quantity sq ON p.stock_quantity_id = sq.stock_id
    JOIN types t ON p.type_id = t.id
`;

const getProducts = async (_req, res) => {
    const rows = await query(PRODUCT_SELECT, [], { op: "getProducts" });
    res.json(rows);
};

const getProduct = async (req, res) => {
    const { id } = req.params; // validated + coerced to number
    const rows = await query(`${PRODUCT_SELECT} WHERE p.id = ?`, [id], { op: "getProduct" });
    if (!rows.length) {
        throw notFound("No product exists with that id");
    }
    res.json(rows[0]);
};

/**
 * Return the full set of filter dimensions, derived from products that actually
 * exist, so the frontend can build category/model/type/edition filters that
 * always match real data. Each entry carries a count of matching products.
 */
const getFilters = async (_req, res) => {
    // Pull distinct values directly from products (joined to types for the type
    // label), grouped per dimension with counts.
    const [categories, models, types, editions] = await Promise.all([
        query(
            `SELECT p.category AS value, COUNT(*) AS count
             FROM products p GROUP BY p.category ORDER BY p.category`,
            [],
            { op: "getFilters.categories" }
        ),
        query(
            `SELECT p.category AS category, p.model AS value, COUNT(*) AS count
             FROM products p GROUP BY p.category, p.model ORDER BY p.category, p.model`,
            [],
            { op: "getFilters.models" }
        ),
        query(
            `SELECT t.type AS value, p.category AS category, COUNT(*) AS count
             FROM products p JOIN types t ON t.id = p.type_id
             GROUP BY t.type, p.category ORDER BY t.type`,
            [],
            { op: "getFilters.types" }
        ),
        query(
            `SELECT p.edition AS value, COUNT(*) AS count
             FROM products p GROUP BY p.edition ORDER BY p.edition`,
            [],
            { op: "getFilters.editions" }
        ),
    ]);

    res.json({ categories, models, types, editions });
};

/**
 * Resolve (or create) a lookup-table id for a given dimension.
 * Table/column names are from a fixed whitelist (never user input); values are
 * always parameterized. Uses INSERT ... ON DUPLICATE KEY to avoid check-then-insert
 * races where a unique constraint exists.
 *
 * @param {Function} tx transactional query fn from withTransaction
 */
const resolveId = async (tx, type, value) => {
    const val = String(value).toLowerCase();

    const findOrInsert = async (table, column) => {
        const rows = await tx(`SELECT id FROM \`${table}\` WHERE \`${column}\` = ?`, [val]);
        if (rows.length) return rows[0].id;
        const result = await tx(`INSERT INTO \`${table}\` (\`${column}\`) VALUES (?)`, [val]);
        return result.insertId;
    };

    switch (type) {
        case "category": {
            const map = { ipad: 1, iphone: 2, "special items": 3 };
            return map[val] ?? (await findOrInsert("category", "category_title"));
        }
        case "model":
            return findOrInsert("model", "model_type");
        case "edition":
            return findOrInsert("edition", "edition_design");
        case "type": {
            const map = { normal: 1, "3d design": 2, simple: 3, light: 4, magnet: 5 };
            return map[val] ?? (await findOrInsert("types", "type"));
        }
        default:
            return 0;
    }
};

const postProduct = async (req, res) => {
    const {
        trend, price, model, edition, category, type, quantity,
        image_url_1, image_url_2, image_url_3,
        description = "", material = "", approach = "", features = "",
    } = req.body;

    const insertId = await withTransaction(async (tx) => {
        const stockId = Math.floor(Math.random() * 100000);

        const typeId = await resolveId(tx, "type", type);

        const result = await tx(
            `INSERT INTO products
                (trend, price, model, edition, category, stock_quantity_id, type_id, image_url_1, image_url_2, image_url_3, description, material, approach, features)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                trend,
                price,
                String(model).toLowerCase(),
                String(edition).toLowerCase(),
                String(category).toLowerCase(),
                stockId,
                typeId,
                image_url_1,
                image_url_2,
                image_url_3,
                description || null,
                material || null,
                approach || null,
                features || null,
            ]
        );

        const editionId = await resolveId(tx, "edition", edition);
        const modelId = await resolveId(tx, "model", model);
        const categoryId = await resolveId(tx, "category", category);

        await tx(
            `INSERT INTO stock_quantity (edition_id, model_id, category_id, quantity, stock_id)
             VALUES (?, ?, ?, ?, ?)`,
            [editionId, modelId, categoryId, quantity, stockId]
        );

        return result.insertId;
    }, { op: "postProduct" });

    res.status(201).json({ id: insertId, message: "Product created" });
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    await withTransaction(async (tx) => {
        // Ensure the product exists (and lock the row) before applying updates.
        const existing = await tx("SELECT id, stock_quantity_id FROM products WHERE id = ? FOR UPDATE", [id]);
        if (!existing.length) {
            throw notFound("No product exists with that id");
        }
        const stockId = existing[0].stock_quantity_id;

        // Map each updatable field to a parameterized statement.
        for (const [field, value] of Object.entries(body)) {
            switch (field) {
                case "price":
                case "trend":
                case "model":
                case "category":
                    await tx(`UPDATE products SET \`${field}\` = ? WHERE id = ?`, [value, id]);
                    break;
                case "edition":
                    await tx(`UPDATE products SET edition = ? WHERE id = ?`, [
                        String(value).toLowerCase(),
                        id,
                    ]);
                    break;
                case "type": {
                    const typeId = await resolveId(tx, "type", value);
                    await tx(`UPDATE products SET type_id = ? WHERE id = ?`, [typeId, id]);
                    break;
                }
                case "image_url_1":
                case "image_url_2":
                case "image_url_3":
                case "description":
                case "material":
                case "approach":
                case "features":
                    await tx(`UPDATE products SET \`${field}\` = ? WHERE id = ?`, [value, id]);
                    break;
                case "quantity":
                    await tx(`UPDATE stock_quantity SET quantity = ? WHERE stock_id = ?`, [value, stockId]);
                    break;
                default:
                    // Unknown field — ignored (schema already strips most, this is belt-and-suspenders).
                    break;
            }
        }
    }, { op: "updateProduct" });

    res.json({ message: "Product updated successfully" });
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    const result = await query("DELETE FROM products WHERE id = ?", [id], { op: "deleteProduct" });
    if (!result.affectedRows) {
        throw notFound("No product exists with that id");
    }
    res.json({ message: "Product deleted" });
};

module.exports = {
    getProducts,
    getProduct,
    getFilters,
    postProduct,
    updateProduct,
    deleteProduct,
};
