/**
 * Custom-it controller — handles "design your own cover" submissions.
 * Parameterized insert via dbClient; body pre-validated. user_id is optional
 * (guests can submit a custom request).
 */
const { query } = require("../dbClient");

const submitCustomOrder = async (req, res) => {
    const { user_id = null, model, sentence, type, design, comments } = req.body;

    const result = await query(
        `INSERT INTO custom_orders (user_id, model, sentence, type, design, comments)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, model, sentence, type, design, comments],
        { op: "submitCustomOrder" }
    );

    res.status(201).json({
        message: "Your custom request has been submitted",
        id: result.insertId,
    });
};

module.exports = { submitCustomOrder };
