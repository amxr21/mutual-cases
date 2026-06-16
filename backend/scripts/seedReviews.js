/**
 * Seed sample reviews so product cards/pages show real ratings.
 *
 * Creates a handful of sample reviewer users (role=customer) and spreads varied
 * ratings + comments across existing products. Idempotent-ish: uses INSERT ...
 * ON DUPLICATE KEY so re-running updates rather than erroring on the unique
 * (user_id, product_id) constraint.
 *
 * Run: node scripts/seedReviews.js [reviewsPerProduct]
 */
const { query, pool } = require("../dbClient");

const REVIEWERS = [
    { google_id: "seed-rev-1", name: "Sara A.", email: "sara.sample@mutual.local" },
    { google_id: "seed-rev-2", name: "Khalid M.", email: "khalid.sample@mutual.local" },
    { google_id: "seed-rev-3", name: "Layla H.", email: "layla.sample@mutual.local" },
    { google_id: "seed-rev-4", name: "Omar R.", email: "omar.sample@mutual.local" },
    { google_id: "seed-rev-5", name: "Noura S.", email: "noura.sample@mutual.local" },
];

const COMMENTS = {
    5: [
        "Absolutely love it — fits perfectly and feels premium.",
        "Best case I've owned. Slim but protective.",
        "Gorgeous design, exactly as pictured. Highly recommend!",
        "Great quality and fast delivery. Very happy.",
    ],
    4: [
        "Really nice case, just wish it came in more colors.",
        "Solid protection and good grip. Minor wish: slightly slimmer.",
        "Looks great and feels durable. Would buy again.",
    ],
    3: [
        "Decent case for the price. Does the job.",
        "It's fine — nothing special but no complaints.",
    ],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const main = async () => {
    const perProduct = parseInt(process.argv[2], 10) || 3;

    // Ensure reviewer users exist; collect their ids.
    const userIds = [];
    for (const r of REVIEWERS) {
        const existing = await query("SELECT id FROM users WHERE email = ?", [r.email]);
        if (existing.length) {
            userIds.push(existing[0].id);
        } else {
            const ins = await query(
                "INSERT INTO users (google_id, name, email, role) VALUES (?, ?, ?, 'customer')",
                [r.google_id, r.name, r.email]
            );
            userIds.push(ins.insertId);
        }
    }

    const products = await query("SELECT id FROM products");
    let count = 0;

    for (const p of products) {
        // Random subset of reviewers for this product (1..perProduct).
        const n = Math.min(randInt(1, perProduct), userIds.length);
        const shuffled = [...userIds].sort(() => Math.random() - 0.5).slice(0, n);

        for (const uid of shuffled) {
            // Weighted toward higher ratings (3..5).
            const rating = pick([5, 5, 5, 4, 4, 3]);
            const comment = pick(COMMENTS[rating]);
            // Seeded reviews are pre-approved so they show on the storefront
            // without needing a pass through the moderation queue.
            await query(
                `INSERT INTO reviews (product_id, user_id, rating, comment, status)
                 VALUES (?, ?, ?, ?, 'approved')
                 ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), status = 'approved'`,
                [p.id, uid, rating, comment]
            );
            count++;
        }
    }

    const agg = await query("SELECT COUNT(*) AS c, ROUND(AVG(rating),2) AS avg FROM reviews");
    console.log(`Seeded ${count} reviews across ${products.length} products. Total reviews: ${agg[0].c}, overall avg: ${agg[0].avg}`);
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Seed failed:", e.message);
    process.exit(1);
});
