-- FitTrack Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  bio           TEXT DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activities (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('run', 'ride', 'walk')),
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  distance_m    REAL NOT NULL DEFAULT 0,
  duration_s    INTEGER NOT NULL DEFAULT 0,
  elevation_m   REAL DEFAULT 0,
  calories      INTEGER DEFAULT 0,
  avg_pace      REAL DEFAULT 0,
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS route_points (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id   TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  latitude      REAL NOT NULL,
  longitude     REAL NOT NULL,
  altitude      REAL,
  timestamp     TEXT NOT NULL,
  seq           INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_route_points_activity ON route_points(activity_id, seq);

CREATE TABLE IF NOT EXISTS follows (
  follower_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS likes (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id   TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, activity_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id   TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goals (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('distance', 'duration', 'activities')),
  target        REAL NOT NULL,
  period        TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS achievements (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge         TEXT NOT NULL,
  description   TEXT NOT NULL,
  earned_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'achievement')),
  from_user_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  activity_id   TEXT REFERENCES activities(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  read          INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_activity ON comments(activity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
