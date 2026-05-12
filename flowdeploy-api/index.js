const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()

const app = express()

// ── Middleware ────────────────────────────────
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// ── Routes ────────────────────────────────────
app.use('/api/pipelines', require('./routes/pipelines'))
app.use('/api/jobs',      require('./routes/jobs'))
app.use('/api/webhooks',  require('./routes/webhooks'))
app.use('/api/logs',      require('./routes/logs'))
app.use('/api/auth',      require('./routes/auth'))

// ── Health check ──────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'FlowDeploy API running' })
})

// ── MongoDB connection ────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(process.env.PORT || 5000, () => {
      console.log(`API listening on port ${process.env.PORT || 5000}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })