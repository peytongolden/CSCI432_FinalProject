const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { init } = require('./db')

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'

function createApp(dbInstance) {
  const app = express()
  app.use(cors())
  app.use(express.json())

  const db = dbInstance

  // Helper functions
  function generateCode(length = 6) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase()
  }

  function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
  }

  // Middleware to verify JWT
  function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ error: 'no token provided' })

    const token = authHeader.replace('Bearer ', '')
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.userId = decoded.userId
      next()
    } catch (err) {
      res.status(401).json({ error: 'invalid token' })
    }
  }

  // ===== Auth Endpoints =====

  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' })
    }

    try {
      // Check if user exists
      const existing = await db.get('SELECT id FROM users WHERE email = ?', email)
      if (existing) {
        return res.status(409).json({ error: 'email already registered' })
      }

      const userId = crypto.randomUUID()
      const hashedPassword = await bcrypt.hash(password, 10)
      const createdAt = Date.now()

      await db.run(
        `INSERT INTO users (id, email, password, name, created_at) VALUES (?, ?, ?, ?, ?)`,
        userId,
        email,
        hashedPassword,
        name || email.split('@')[0],
        createdAt
      )

      const token = generateToken(userId)
      res.status(201).json({
        success: true,
        token,
        user: { id: userId, email, name: name || email.split('@')[0] }
      })
    } catch (err) {
      console.error('Register error', err)
      res.status(500).json({ error: 'registration failed' })
    }
  })

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    try {
      const user = await db.get('SELECT id, email, password, name FROM users WHERE email = ?', email)

      if (!user) {
        return res.status(401).json({ error: 'invalid email or password' })
      }

      const passwordMatch = await bcrypt.compare(password, user.password)
      if (!passwordMatch) {
        return res.status(401).json({ error: 'invalid email or password' })
      }

      const token = generateToken(user.id)
      res.status(200).json({
        success: true,
        token,
        user: { id: user.id, email: user.email, name: user.name }
      })
    } catch (err) {
      console.error('Login error', err)
      res.status(500).json({ error: 'login failed' })
    }
  })

  // Get user profile
  app.get('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
      const user = await db.get(
        'SELECT id, email, name, phone, bio FROM users WHERE id = ?',
        req.userId
      )
      if (!user) return res.status(404).json({ error: 'user not found' })

      res.json({ user })
    } catch (err) {
      console.error('Get profile error', err)
      res.status(500).json({ error: 'failed to fetch profile' })
    }
  })

  // Update user profile
  app.put('/api/auth/profile', authMiddleware, async (req, res) => {
    const { name, phone, bio } = req.body || {}

    try {
      await db.run(
        'UPDATE users SET name = ?, phone = ?, bio = ? WHERE id = ?',
        name || null,
        phone || null,
        bio || null,
        req.userId
      )

      const user = await db.get(
        'SELECT id, email, name, phone, bio FROM users WHERE id = ?',
        req.userId
      )

      res.json({ success: true, user })
    } catch (err) {
      console.error('Update profile error', err)
      res.status(500).json({ error: 'failed to update profile' })
    }
  })

  // ===== Protected Meeting Endpoints =====

  app.post('/api/meetings', authMiddleware, async (req, res) => {
    const { name, date, time, description } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name is required' })

    try {
      const id = crypto.randomUUID()
      let code = generateCode(6)

      // ensure unique code
      let exists = await db.get('SELECT 1 FROM meetings WHERE code = ?', code)
      let attempts = 0
      while (exists && attempts < 5) {
        code = generateCode(6)
        exists = await db.get('SELECT 1 FROM meetings WHERE code = ?', code)
        attempts++
      }

      const created_at = Date.now()
      await db.run(
        `INSERT INTO meetings (id, name, date, time, description, code, creator_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        name,
        date || null,
        time || null,
        description || null,
        code,
        req.userId,
        created_at
      )

      const meeting = { id, name, date, time, description, code, creator_id: req.userId, created_at }
      res.status(201).json({ meeting })
    } catch (err) {
      console.error('Create meeting error', err)
      res.status(500).json({ error: 'failed to create meeting' })
    }
  })

  app.post('/api/meetings/join', authMiddleware, async (req, res) => {
    const { code, name } = req.body || {}
    if (!code || !name) return res.status(400).json({ error: 'code and name are required' })

    try {
      const meeting = await db.get('SELECT * FROM meetings WHERE code = ?', code.toUpperCase())
      if (!meeting) return res.status(404).json({ error: 'meeting not found' })

      const joined_at = Date.now()
      await db.run(
        'INSERT INTO attendees (meeting_id, user_id, name, joined_at) VALUES (?, ?, ?, ?)',
        meeting.id,
        req.userId,
        name,
        joined_at
      )

      res.status(200).json({ meeting: { id: meeting.id, name: meeting.name, code: meeting.code } })
    } catch (err) {
      console.error('Join meeting error', err)
      res.status(500).json({ error: 'failed to join meeting' })
    }
  })

  app.get('/api/meetings/:code', authMiddleware, async (req, res) => {
    const { code } = req.params
    try {
      const meeting = await db.get('SELECT * FROM meetings WHERE code = ?', code.toUpperCase())
      if (!meeting) return res.status(404).json({ error: 'meeting not found' })

      // Get attendees
      const attendees = await db.all('SELECT user_id, name FROM attendees WHERE meeting_id = ?', meeting.id)

      res.json({ meeting: { ...meeting, attendees } })
    } catch (err) {
      console.error('Get meeting error', err)
      res.status(500).json({ error: 'failed to fetch meeting' })
    }
  })

  return app
}

// If run directly, initialize DB and start server
if (require.main === module) {
  const PORT = process.env.PORT || 4000
  init()
    .then((database) => {
      const app = createApp(database)
      app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`))
    })
    .catch((err) => {
      console.error('Failed to initialize DB', err)
      process.exit(1)
    })
}

module.exports = { createApp }
