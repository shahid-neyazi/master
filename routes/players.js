const express = require("express");
const db = require("../db/init");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function publicUser(u) {
  const { password_hash, ...rest } = u;
  return rest;
}

// GET /api/players?city=&skill=&q=
router.get("/", (req, res) => {
  const { city, skill, q } = req.query;
  let sql = "SELECT * FROM users WHERE 1=1";
  const params = [];
  if (city) { sql += " AND city LIKE ?"; params.push(`%${city}%`); }
  if (skill && skill !== "All Levels") { sql += " AND skill_level = ?"; params.push(skill); }
  if (q) { sql += " AND (first_name LIKE ? OR last_name LIKE ?)"; params.push(`%${q}%`, `%${q}%`); }
  sql += " ORDER BY created_at DESC LIMIT 50";
  const players = db.prepare(sql).all(...params).map(publicUser);
  res.json({ players });
});

router.get("/stats", (req, res) => {
  const players = db.prepare("SELECT COUNT(*) c FROM users").get().c;
  const cities = db.prepare("SELECT COUNT(DISTINCT city) c FROM users WHERE city IS NOT NULL").get().c;
  const matches = db.prepare("SELECT COUNT(*) c FROM bookings WHERE status = 'confirmed'").get().c;
  res.json({ players, cities, matches });
});

router.get("/:id", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "Player not found" });
  const reviews = db.prepare("SELECT * FROM reviews WHERE reviewer_id != ? ORDER BY created_at DESC").all(req.params.id);
  res.json({ player: publicUser(user), reviews });
});

router.patch("/me/plan", requireAuth, (req, res) => {
  const { plan } = req.body;
  if (!["Free", "Pro", "Coach"].includes(plan)) return res.status(400).json({ error: "Invalid plan" });
  db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, req.user.id);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(user) });
});

module.exports = router;
