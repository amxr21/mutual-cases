const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const pool = require("../db"); // or wherever your db connection is

const jwt = require("jsonwebtoken");
const express = require('express');

const router = express.Router()


router.post("/api/auth", async (req, res) => {
  try {
      
      const { id_token } = req.body;
    //   console.log(id_token);

    // 1. Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;

    // 2. Check if user exists in DB
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE google_id = ?",
      [google_id]
    );

    let user;
    if (rows.length === 0) {
      // 3. Create new user
      const [result] = await pool.query(
        "INSERT INTO users (google_id, name, email, profile_picture) VALUES (?, ?, ?, ?)",
        [google_id, name, email ,picture]
      );
      user = { id: result.insertId, google_id, email, name, picture };
    } else {
      user = rows[0];
    }

    // 4. Generate app JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token, name, email, picture, userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Google login failed" });
  }
});

module.exports = router;