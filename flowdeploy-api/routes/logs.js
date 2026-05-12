const router = require('express').Router()
const LogEntry = require('../models/LogEntry')

// in-memory map of jobId → open SSE clients
const clients = new Map()

// GET — browser opens this as EventSource for live logs
router.get('/:jobId', async (req, res) => {
  const { jobId } = req.params

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // send existing logs first (handles page refresh)
  const existing = await LogEntry
    .find({ job: jobId })
    .sort({ timestamp: 1 })
  for (const entry of existing) {
    res.write(`data: ${JSON.stringify({ line: entry.line, step: entry.stepName })}\n\n`)
  }

  // register client for live pushes
  if (!clients.has(jobId)) clients.set(jobId, [])
  clients.get(jobId).push(res)

  // clean up on disconnect
  req.on('close', () => {
    const list = clients.get(jobId) || []
    clients.set(jobId, list.filter(c => c !== res))
  })
})

// POST — Python runner calls this to push each log line
router.post('/:jobId', async (req, res) => {
  const { jobId } = req.params
  const { line, stepName, stream } = req.body

  await LogEntry.create({ job: jobId, line, stepName, stream })

  const watching = clients.get(jobId) || []
  const payload = `data: ${JSON.stringify({ line, step: stepName })}\n\n`
  watching.forEach(client => client.write(payload))

  res.json({ ok: true })
})

module.exports = router