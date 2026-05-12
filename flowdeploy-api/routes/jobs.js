const router = require('express').Router()
const Job = require('../models/Job')
const Pipeline = require('../models/Pipeline')
const { protect } = require('../middleware/auth')

// GET job history for a pipeline
router.get('/pipeline/:pipelineId', protect, async (req, res) => {
  try {
    const jobs = await Job
      .find({ pipeline: req.params.pipelineId })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ✅ MUST be before /:id — otherwise Express treats "queued" as an id
// GET /api/jobs/queued — Python runner polls this
router.get('/queued', async (req, res) => {
  try {
    const jobs = await Job
      .find({ status: 'queued' })
      .limit(5)
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET single job — must come AFTER all specific routes
router.get('/:id', protect, async (req, res) => {
  try {
    const job = await Job
      .findById(req.params.id)
      .populate('pipeline', 'name repoUrl')
    if (!job) return res.status(404).json({ error: 'Job not found' })
    res.json(job)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST manually trigger a pipeline run
router.post('/trigger/:pipelineId', protect, async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({
      _id: req.params.pipelineId,
      owner: req.user.id
    })
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' })

    const job = await Job.create({
      pipeline: pipeline._id,
      status: 'queued',
      triggeredBy: 'manual'
    })
    res.status(201).json(job)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH update job status — called by Python runner
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, steps, startedAt, finishedAt } = req.body
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status, steps, startedAt, finishedAt },
      { new: true }
    )
    res.json(job)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router