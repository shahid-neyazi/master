const express = require("express");
const db = require("../db/init");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/slots?status=open  -> browse open slots, with host info
router.get("/", (req, res) => {
  const status = req.query.status || "open";
  const slots = db.prepare(`
    SELECT s.*, u.first_name, u.last_name, u.city, u.skill_level, u.avatar_initials
    FROM slots s JOIN users u ON u.id = s.user_id
    WHERE s.status = ?
    ORDER BY s.slot_date ASC, s.start_time ASC
  `).all(status);
  res.json({ slots });
});

// POST /api/slots  (auth) — a player publishes an available slot
router.post("/", requireAuth, (req, res) => {
  const { slot_date, start_time, end_time, location, price } = req.body;
  if (!slot_date || !start_time || !end_time) {
    return res.status(400).json({ error: "slot_date, start_time and end_time are required" });
  }
  const info = db.prepare(`
    INSERT INTO slots (user_id, slot_date, start_time, end_time, location, price, status)
    VALUES (?,?,?,?,?,?, 'open')
  `).run(req.user.id, slot_date, start_time, end_time, location || null, price || 0);
  const slot = db.prepare("SELECT * FROM slots WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ slot });
});

router.delete("/:id", requireAuth, (req, res) => {
  const slot = db.prepare("SELECT * FROM slots WHERE id = ?").get(req.params.id);
  if (!slot) return res.status(404).json({ error: "Slot not found" });
  if (slot.user_id !== req.user.id) return res.status(403).json({ error: "Not your slot" });
  db.prepare("DELETE FROM slots WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
