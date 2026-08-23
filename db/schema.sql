-- ServeUp database schema (SQLite)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  city TEXT,
  skill_level TEXT CHECK(skill_level IN ('Beginner','Intermediate','Advanced','Professional')) DEFAULT 'Beginner',
  bio TEXT,
  session_rate INTEGER, -- NULL = free/no coaching rate
  plan TEXT CHECK(plan IN ('Free','Pro','Coach')) DEFAULT 'Free',
  avatar_initials TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_date TEXT NOT NULL,        -- 'YYYY-MM-DD'
  start_time TEXT NOT NULL,       -- 'HH:MM'
  end_time TEXT NOT NULL,
  location TEXT,
  price INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('open','booked','cancelled')) DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_id INTEGER NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK(status IN ('pending','confirmed','declined','cancelled')) DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,   -- allows public/anonymous review submissions from the landing page
  city TEXT,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_slots_user ON slots(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id);
