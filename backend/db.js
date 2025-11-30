const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, 'data.sqlite')

async function init() {
  const db = await sqlite.open({ filename: DB_PATH, driver: sqlite3.Database })

  // Users table
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      bio TEXT,
      created_at INTEGER NOT NULL
    )
  `)

  // Meetings table
  await db.run(`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT,
      time TEXT,
      description TEXT,
      code TEXT UNIQUE NOT NULL,
      creator_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(creator_id) REFERENCES users(id)
    )
  `)

  // Attendees table
  await db.run(`
    CREATE TABLE IF NOT EXISTS attendees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id TEXT NOT NULL,
      user_id TEXT,
      name TEXT NOT NULL,
      joined_at INTEGER NOT NULL,
      FOREIGN KEY(meeting_id) REFERENCES meetings(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `)

  return db
}

module.exports = { init }
