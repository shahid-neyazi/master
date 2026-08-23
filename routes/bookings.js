const express = require("express");
const db = require("../db/init");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/bookings  (auth) — request to book an open slot
router.post("/", requireAuth, (req, res) => {
  const { slot_id } = req.body;
  const slot = db.prepare("SELECT * FROM slots WHERE id = ?").get(slot_id);
  if (!slot) return res.status(404).json({ error: "Slot not found" });
  if (slot.status !== "open") return res.status(409).json({ error: "Slot is no longer open" });
  if (slot.user_id === req.user.id) return res.status(400).json({ error: "You can't book your own slot" });

  const info = db.prepare(`
    INSERT INTO bookings (slot_id, requester_id, status) VALUES (?,?, 'pending')
  `).run(slot_id, req.user.id);
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ booking });
});

// GET /api/bookings/mine (auth) — bookings I made + booking requests on my slots
router.get("/mine", requireAuth, (req, res) => {
  const asRequester = db.prepare(`
    SELECT b.*, s.slot_date, s.start_time, s.end_time, s.location, u.first_name, u.last_name
    FROM bookings b
    JOIN slots s ON s.id = b.slot_id
    JOIN users u ON u.id = s.user_id
    WHERE b.requester_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id);

  const asHost = db.prepare(`
    SELECT b.*, s.slot_date, s.start_time, s.end_time, s.location, u.first_name, u.last_name
    FROM bookings b
    JOIN slots s ON s.id = b.slot_id
    JOIN users u ON u.id = b.requester_id
    WHERE s.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id);

  res.json({ requested: asRequester, incoming: asHost });
});

// PATCH /api/bookings/:id  (auth, must be the slot's host) — confirm/decline
router.patch("/:id", requireAuth, (req, res) => {
  const { status } = req.body;
  if (!["confirmed", "declined", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  const slot = db.prepare("SELECT * FROM slots WHERE id = ?").get(booking.slot_id);
  if (slot.user_id !== req.user.id && booking.requester_id !== req.user.id) {
    return res.status(403).json({ error: "Not authorized to update this booking" });
  }
  db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, req.params.id);
  if (status === "confirmed") db.prepare("UPDATE slots SET status = 'booked' WHERE id = ?").run(slot.id);
  if (status === "declined" || status === "cancelled") db.prepare("UPDATE slots SET status = 'open' WHERE id = ?").run(slot.id);
  res.json({ ok: true });
});

module.exports = router;
