/**
 * Seed sample delivery staff so the Delivery admin page has realistic data.
 *
 * Creates a handful of users with role='delivery' plus their delivery_profiles
 * (vehicle, plate, license, coverage zone/emirate/country, availability).
 * Idempotent: keyed on email — re-running updates the profile rather than
 * duplicating. Requires scripts/migrateDelivery.js to have run first.
 *
 * Run: node scripts/seedDelivery.js
 */
const { query, pool } = require("../dbClient");

const DRIVERS = [
    { name: "Rashed Al Mansoori", email: "rashed.delivery@mutual.local", phone: "+971501112233",
      vehicle_type: "Motorbike", plate_number: "DXB-A 12345", license_number: "DL-9087654",
      zone: "Marina, JBR", emirate: "Dubai", country: "United Arab Emirates", status: "active" },
    { name: "Yousef Al Balushi", email: "yousef.delivery@mutual.local", phone: "+971502223344",
      vehicle_type: "Car", plate_number: "AUH-12 998", license_number: "DL-7741200",
      zone: "Khalifa City, Yas", emirate: "Abu Dhabi", country: "United Arab Emirates", status: "on_shift" },
    { name: "Imran Khan", email: "imran.delivery@mutual.local", phone: "+971503334455",
      vehicle_type: "Van", plate_number: "SHJ-3 44210", license_number: "DL-5530987",
      zone: "Al Nahda, Muwailih", emirate: "Sharjah", country: "United Arab Emirates", status: "active" },
    { name: "Fatima Al Hashimi", email: "fatima.delivery@mutual.local", phone: "+971504445566",
      vehicle_type: "Motorbike", plate_number: "AJM-B 7782", license_number: "DL-2218845",
      zone: "Al Jurf, City Centre", emirate: "Ajman", country: "United Arab Emirates", status: "inactive" },
    { name: "Abdullah Al Otaibi", email: "abdullah.delivery@mutual.local", phone: "+966512345678",
      vehicle_type: "Car", plate_number: "RUH-4521", license_number: "KSA-DL-66201",
      zone: "Olaya, Al Malaz", emirate: "", country: "Saudi Arabia", status: "active" },
    { name: "Hamad Al Kuwari", email: "hamad.delivery@mutual.local", phone: "+97455667788",
      vehicle_type: "Motorbike", plate_number: "QA-99120", license_number: "QA-DL-30215",
      zone: "West Bay, Al Sadd", emirate: "", country: "Qatar", status: "on_shift" },
];

const main = async () => {
    let created = 0;
    let updated = 0;

    for (const d of DRIVERS) {
        const existing = await query("SELECT id, role FROM users WHERE email = ?", [d.email]);

        let userId;
        if (existing.length) {
            userId = existing[0].id;
            // Make sure the role is 'delivery' even if the row pre-existed.
            await query("UPDATE users SET name = ?, phone = ?, role = 'delivery' WHERE id = ?", [
                d.name,
                d.phone,
                userId,
            ]);
            updated++;
        } else {
            const googleId = `seed-delivery-${d.email}`;
            const ins = await query(
                "INSERT INTO users (google_id, name, email, role, phone) VALUES (?, ?, ?, 'delivery', ?)",
                [googleId, d.name, d.email, d.phone]
            );
            userId = ins.insertId;
            created++;
        }

        // Upsert the delivery profile (unique on user_id).
        await query(
            `INSERT INTO delivery_profiles
                (user_id, vehicle_type, plate_number, license_number, zone, emirate, country, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                vehicle_type = VALUES(vehicle_type), plate_number = VALUES(plate_number),
                license_number = VALUES(license_number), zone = VALUES(zone),
                emirate = VALUES(emirate), country = VALUES(country), status = VALUES(status)`,
            [
                userId,
                d.vehicle_type,
                d.plate_number,
                d.license_number,
                d.zone,
                d.emirate || null,
                d.country,
                d.status,
            ]
        );
    }

    console.log(`Seeded delivery staff — created ${created}, updated ${updated}.`);
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Seed failed:", e.message);
    process.exit(1);
});
