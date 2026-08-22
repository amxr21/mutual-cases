/**
 * Seed sample customers, orders (spread across statuses + the last ~60 days),
 * order items, addresses, status history, and a couple of discount codes — so
 * the admin Orders/Reports/Payments/Discounts pages have realistic demo data.
 *
 * Idempotent-ish: customers are upserted by email; orders are only created if
 * fewer than the target count already exist (skips re-seeding on re-run).
 *
 * Run: node scripts/seedOrders.js [count]
 */
const { withTransaction, query, pool } = require("../dbClient");

const STATUS = { PENDING: 1, CONFIRMED: 2, SHIPPED: 3, DELIVERED: 4, CANCELED: 5, RETURNED: 6 };
const STATUS_LABEL = { 1: "Pending", 2: "Confirmed", 3: "Shipped", 4: "Delivered", 5: "Canceled", 6: "Returned" };
// Weighted so most orders look "realized" (confirmed/shipped/delivered).
const STATUS_WEIGHTS = [
    STATUS.DELIVERED, STATUS.DELIVERED, STATUS.DELIVERED,
    STATUS.SHIPPED, STATUS.SHIPPED,
    STATUS.CONFIRMED, STATUS.CONFIRMED,
    STATUS.PENDING,
    STATUS.CANCELED,
    STATUS.RETURNED,
];

const CUSTOMERS = [
    { google_id: "seed-cust-1", name: "Aisha Al Marri", email: "aisha.cust@mutual.local", city: "Dubai", area: "Downtown", country: "United Arab Emirates" },
    { google_id: "seed-cust-2", name: "Mohammed Rahman", email: "mohammed.cust@mutual.local", city: "Abu Dhabi", area: "Al Reem Island", country: "United Arab Emirates" },
    { google_id: "seed-cust-3", name: "Sara Haddad", email: "sara.cust@mutual.local", city: "Sharjah", area: "Al Majaz", country: "United Arab Emirates" },
    { google_id: "seed-cust-4", name: "Yusuf Karim", email: "yusuf.cust@mutual.local", city: "Dubai", area: "JLT", country: "United Arab Emirates" },
    { google_id: "seed-cust-5", name: "Fatima Noor", email: "fatima.cust@mutual.local", city: "Ajman", area: "Al Nuaimiya", country: "United Arab Emirates" },
    { google_id: "seed-cust-6", name: "Omar Siddiqui", email: "omar.cust@mutual.local", city: "Ras Al Khaimah", area: "Al Nakheel", country: "United Arab Emirates" },
    { google_id: "seed-cust-7", name: "Layla Nasser", email: "layla.cust@mutual.local", city: "Dubai", area: "Al Barsha", country: "United Arab Emirates" },
    { google_id: "seed-cust-8", name: "Khalid Farooq", email: "khalid.cust@mutual.local", city: "Fujairah", area: "Sakamkam", country: "United Arab Emirates" },
];

const DISCOUNTS = [
    { code: "WELCOME10", type: "percent", value: 10, min_spend: 0, max_uses: 500, per_customer_limit: 1, first_order_only: 1, featured: 1 },
    { code: "FREESHIP", type: "free_shipping", value: 0, min_spend: 150, max_uses: null, per_customer_limit: null, first_order_only: 0, featured: 1 },
    { code: "SAVE20", type: "fixed", value: 20, min_spend: 100, max_uses: 200, per_customer_limit: 2, first_order_only: 0, featured: 0 },
];

const PAYMENT_METHODS = ["cod", "card", "card", "card"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const genOrderNumber = (i) =>
    "MTL-" + Date.now().toString(36).toUpperCase() + "-" + String(1000 + i);

/** Random datetime within the last `days` days. */
const randomRecentDate = (days) => {
    const now = Date.now();
    const past = now - randInt(0, days * 24 * 60 * 60 * 1000);
    return new Date(past);
};

const ensureOrderStatusLabels = async () => {
    for (const [id, status] of Object.entries(STATUS_LABEL)) {
        await query(
            "INSERT INTO order_status (id, status) VALUES (?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)",
            [id, status]
        );
    }
    console.log("✓ order_status labels ready");
};

const ensureCustomers = async () => {
    const ids = [];
    for (const c of CUSTOMERS) {
        const existing = await query("SELECT id FROM users WHERE email = ?", [c.email]);
        if (existing.length) {
            ids.push(existing[0].id);
            continue;
        }
        const ins = await query(
            `INSERT INTO users (google_id, name, email, role, city, area, country)
             VALUES (?, ?, ?, 'customer', ?, ?, ?)`,
            [c.google_id, c.name, c.email, c.city, c.area, c.country]
        );
        ids.push(ins.insertId);
    }
    console.log(`✓ ${ids.length} demo customers ready`);
    return ids;
};

const ensureDiscounts = async () => {
    for (const d of DISCOUNTS) {
        await query(
            `INSERT INTO discounts (code, type, value, min_spend, max_uses, per_customer_limit, first_order_only, featured, active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE type = VALUES(type), value = VALUES(value)`,
            [d.code, d.type, d.value, d.min_spend, d.max_uses, d.per_customer_limit, d.first_order_only, d.featured]
        );
    }
    console.log(`✓ ${DISCOUNTS.length} discount codes ready`);
};

const seedOneOrder = async (i, customerIds, products) =>
    withTransaction(async (tx) => {
        const userId = pick(customerIds);
        const statusId = pick(STATUS_WEIGHTS);
        const orderDate = randomRecentDate(60);
        const itemCount = randInt(1, 3);
        const chosen = [...products].sort(() => Math.random() - 0.5).slice(0, itemCount);

        let total = 0;
        const lines = chosen.map((p) => {
            const qty = randInt(1, 2);
            total += Number(p.price) * qty;
            return { ...p, qty };
        });

        const orderNumber = genOrderNumber(i);
        const paymentMethod = pick(PAYMENT_METHODS);

        const orderRes = await tx(
            `INSERT INTO orders (user_id, order_date, status_id, total, order_number, payment_method)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [String(userId), orderDate, statusId, Math.round(total * 100) / 100, orderNumber, paymentMethod]
        );
        const orderId = orderRes.insertId;

        for (const l of lines) {
            await tx(
                `INSERT INTO order_items (order_id, product_id, quantity, price, edition_id, model_id, category_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, l.id, l.qty, l.price, l.edition_id, l.model_id, l.category_id]
            );
        }

        const customer = CUSTOMERS.find((_, idx) => customerIds[idx] === userId) || CUSTOMERS[0];
        await tx(
            `INSERT INTO addresses (order_id, country, city, area, address) VALUES (?, ?, ?, ?, ?)`,
            [orderId, customer.country, customer.city, customer.area, `${randInt(1, 40)} ${pick(["Street", "Road", "Boulevard"])} ${randInt(1, 20)}`]
        );

        await tx(
            `INSERT INTO order_status_history (order_id, status_id, note, created_at) VALUES (?, ?, ?, ?)`,
            [orderId, statusId, `Seed: order created as ${STATUS_LABEL[statusId]}`, orderDate]
        );

        return orderId;
    }, { op: "seedOneOrder" });

const main = async () => {
    const target = parseInt(process.argv[2], 10) || 40;

    await ensureOrderStatusLabels();
    await ensureDiscounts();
    const customerIds = await ensureCustomers();

    const products = await query(
        `SELECT p.id, p.price, sq.edition_id, sq.model_id, sq.category_id
         FROM products p JOIN stock_quantity sq ON sq.stock_id = p.stock_quantity_id`
    );
    if (!products.length) {
        console.error("No products found — run seedProducts.js first.");
        process.exit(1);
    }

    const before = await query("SELECT COUNT(*) AS c FROM orders");
    if (before[0].c >= target) {
        console.log(`Orders already at ${before[0].c} (>= target ${target}). Skipping.`);
        await pool.end();
        process.exit(0);
    }

    const toCreate = target - before[0].c;
    console.log(`Orders before: ${before[0].c}. Creating ${toCreate} more...`);

    let created = 0;
    for (let i = 0; i < toCreate; i++) {
        try {
            await seedOneOrder(before[0].c + i, customerIds, products);
            created++;
            if (created % 10 === 0) console.log(`  ...${created} orders created`);
        } catch (err) {
            console.error("  order insert error:", err.message);
        }
    }

    const after = await query("SELECT COUNT(*) AS c FROM orders");
    console.log(`Done. Created ${created} orders. Orders now: ${after[0].c}.`);
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
});
