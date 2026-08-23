const express = require("express");
const db = require("../db/init");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
  const reviews = db.prepare("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 20").all();
  res.json({ reviews });
});

// Public review submission (matches the landing page's "Leave a Review" form).
// If logged in, links the review to the account; otherwise stores the typed name.
router.post("/", optionalAuth, (req, res) => {
  const { name, city, rating, comment } = req.body;
  if (!rating || !comment) return res.status(400).json({ error: "rating and comment are required" });

  let reviewer_id = null;
  let reviewer_name = name || "Anonymous Player";
  if (req.user) {
    const u = db.prepare("SELECT first_name, last_name FROM users WHERE id = ?").get(req.user.id);
    if (u) { reviewer_id = req.user.id; reviewer_name = `${u.first_name} ${u.last_name}`; }
  }

  const info = db.prepare(`
    INSERT INTO reviews (reviewer_id, reviewer_name, city, rating, comment) VALUES (?,?,?,?,?)
  `).run(reviewer_id, reviewer_name, city || null, rating, comment);
  const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ review });
});

module.exports = router;
