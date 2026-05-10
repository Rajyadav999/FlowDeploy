// ── Validation middleware ─────────────────────
// Call this before your route handler to check
// required fields are present in req.body
// Usage: router.post('/', validate(['name','repoUrl','yamlContent']), handler)

const validate = (fields) => (req, res, next) => {
  const missing = fields.filter(field => {
    const value = req.body[field]
    return value === undefined || value === null || value === ''
  })

  if (missing.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missing.join(', ')}`
    })
  }

  next()
}

module.exports = { validate }