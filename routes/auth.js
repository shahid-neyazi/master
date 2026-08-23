const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/init");
const { requireAuth, SECRET } = require("../middleware/auth");

const router = express.Router();

function publicUser(u) {
  const { password_hash, ...rest } = u;
  return rest;
}

router.post("/register", (req, res) => {
  const { first_name, last_name, email, phone, city, skill_level, password, bio, session_rate } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: "first_name, last_name, email and password are required" });
  }
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const password_hash = bcrypt.hashSync(password, 10);
  const avatar_initials = (first_name[0] + last_name[0]).toUpperCase();

  const info = db.prepare(`
    INSERT INTO users (first_name,last_name,email,phone,password_hash,city,skill_level,bio,session_rate,plan,avatar_initials)
    VALUES (?,?,?,?,?,?,?,?,?, 'Free', ?)
  `).run(first_name, last_name, email, phone || null, password_hash, city || null, skill_level || "Beginner", bio || null, session_rate || null, avatar_initials);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: "7d" });
  res.json({ token, user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

module.exports = router;
