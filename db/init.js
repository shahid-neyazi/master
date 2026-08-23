// Initializes the SQLite database: creates tables (if missing) and seeds
// demo data on first run so the site isn't empty out of the box.
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "serveup.db");
const isNewDb = !fs.existsSync(DB_PATH);
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
db.exec(schema);

if (isNewDb) {
  console.log("New database detected — seeding demo data...");
  seed();
}

function seed() {
  const insertUser = db.prepare(`
    INSERT INTO users (first_name,last_name,email,phone,password_hash,city,skill_level,bio,session_rate,plan,avatar_initials)
    VALUES (@first_name,@last_name,@email,@phone,@password_hash,@city,@skill_level,@bio,@session_rate,@plan,@avatar_initials)
  `);

  const demoPassword = bcrypt.hashSync("password123", 10);

  const players = [
    { first_name: "Rahul", last_name: "Khanna", email: "rahul@example.com", phone: "9820011223", city: "Mumbai", skill_level: "Advanced", bio: "Weekend warrior, love doubles.", session_rate: null, plan: "Pro", avatar_initials: "RK" },
    { first_name: "Ananya", last_name: "Verma", email: "ananya@example.com", phone: "9845566778", city: "Bangalore", skill_level: "Intermediate", bio: "Looking for regular practice partners.", session_rate: null, plan: "Free", avatar_initials: "AV" },
    { first_name: "Siddharth", last_name: "Malhotra", email: "siddharth@example.com", phone: "9967788990", city: "Mumbai", skill_level: "Professional", bio: "Semi-pro coach, NTRP 6.0.", session_rate: 800, plan: "Coach", avatar_initials: "SM" },
    { first_name: "Priya", last_name: "Rao", email: "priya@example.com", phone: "9912233445", city: "Hyderabad", skill_level: "Beginner", bio: "New to tennis, excited to learn!", session_rate: null, plan: "Free", avatar_initials: "PR" },
    { first_name: "Karan", last_name: "Mehta", email: "karan@example.com", phone: "9900112233", city: "Delhi", skill_level: "Advanced", bio: "Play every weekend at DLTA.", session_rate: null, plan: "Pro", avatar_initials: "KM" },
  ];

  const userIds = {};
  for (const p of players) {
    const info = insertUser.run({ ...p, password_hash: demoPassword });
    userIds[p.email] = info.lastInsertRowid;
  }

  const insertSlot = db.prepare(`
    INSERT INTO slots (user_id, slot_date, start_time, end_time, location, price, status)
    VALUES (?,?,?,?,?,?,?)
  `);
  const today = new Date();
  function isoPlusDays(n) {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  insertSlot.run(userIds["rahul@example.com"], isoPlusDays(2), "18:00", "19:00", "DLTA Complex, Court 4", 300, "open");
  insertSlot.run(userIds["siddharth@example.com"], isoPlusDays(1), "07:00", "08:00", "Cricket Club of India", 800, "open");
  insertSlot.run(userIds["karan@example.com"], isoPlusDays(3), "17:30", "18:30", "DDA Tennis Academy", 250, "open");

  const insertReview = db.prepare(`
    INSERT INTO reviews (reviewer_id, reviewer_name, city, rating, comment) VALUES (?,?,?,?,?)
  `);
  insertReview.run(userIds["ananya@example.com"], "Ananya Verma", "Bangalore", 5, "Found a practice partner within 10 minutes. ServeUp is exactly what the tennis community needed in India.");
  insertReview.run(userIds["siddharth@example.com"], "Siddharth Malhotra", "Mumbai", 5, "I coach semi-professionally and the payment feature is seamless. My schedule is always booked now!");
  insertReview.run(userIds["priya@example.com"], "Priya Rao", "Hyderabad", 4, "The chat feature makes coordination so smooth. No more WhatsApp chaos trying to find a partner last minute.");

  const insertMessage = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, content) VALUES (?,?,?)
  `);
  const rahul = userIds["rahul@example.com"];
  const karan = userIds["karan@example.com"];
  insertMessage.run(rahul, karan, "Hey! Saw your profile — interested in a doubles match this Saturday?");
  insertMessage.run(karan, rahul, "Sounds great! I'm free in the evening. Which court are you thinking?");
  insertMessage.run(rahul, karan, "DLTA complex, court 4. I can book it for 6 PM. ₹300/person for the slot.");
  insertMessage.run(karan, rahul, "Perfect, count me in! Send me the booking confirmation.");

  console.log("Seed complete:", Object.keys(userIds).length, "players,", "demo login password for all seeded users: password123");
}

module.exports = db;
