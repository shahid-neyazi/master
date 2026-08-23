const express = require("express");
const db = require("../db/init");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/messages/threads (auth) — list of people I've messaged with, most recent first
router.get("/threads", requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.avatar_initials,
           MAX(m.created_at) AS last_at
    FROM messages m
    JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY u.id
    ORDER BY last_at DESC
  `).all(req.user.id, req.user.id, req.user.id);
  res.json({ threads: rows });
});

// GET /api/messages/:otherUserId (auth) — full conversation with one person
router.get("/:otherUserId", requireAuth, (req, res) => {
  const other = Number(req.params.otherUserId);
  const rows = db.prepare(`
    SELECT * FROM messages
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `).all(req.user.id, other, other, req.user.id);
  res.json({ messages: rows });
});

// POST /api/messages (auth)
router.post("/", requireAuth, (req, res) => {
  const { receiver_id, content } = req.body;
  if (!receiver_id || !content) return res.status(400).json({ error: "receiver_id and content are required" });
  const info = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, content) VALUES (?,?,?)
  `).run(req.user.id, receiver_id, content);
  const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ message });
});

module.exports = router;
