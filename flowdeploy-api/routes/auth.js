const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

// ── User model (inline to keep things simple) ─
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

// helper — generate JWT
const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' })

    const exists = await User.findOne({ email })
    if (exists)
      return res.status(400).json({ error: 'Email already registered' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashed })

    res.status(201).json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' })

    const user = await User.findOne({ email })
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password)
    if (!match)
      return res.status(401).json({ error: 'Invalid credentials' })

    res.json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router