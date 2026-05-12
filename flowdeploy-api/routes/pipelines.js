const router = require('express').Router()
const Pipeline = require('../models/Pipeline')
const { protect } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

// GET all pipelines for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const pipelines = await Pipeline
      .find({ owner: req.user.id })
      .sort({ updatedAt: -1 })
    res.json(pipelines)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET one pipeline
router.get('/:id', protect, async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({
      _id: req.params.id,
      owner: req.user.id
    })
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' })
    res.json(pipeline)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create a new pipeline
router.post('/', protect, validate(['name', 'repoUrl', 'yamlContent']), async (req, res) => {
  try {
    const { name, repoUrl, branch, yamlContent } = req.body
    const pipeline = await Pipeline.create({
      name, repoUrl, branch, yamlContent,
      owner: req.user.id
    })
    res.status(201).json(pipeline)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT update pipeline
router.put('/:id', protect, validate(['name', 'repoUrl', 'yamlContent']), async (req, res) => {
  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' })
    res.json(pipeline)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE pipeline
router.delete('/:id', protect, async (req, res) => {
  try {
    await Pipeline.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    })
    res.json({ message: 'Pipeline deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/internal/:id', async (req, res) => {
  try {
    const pipeline = await Pipeline.findById(req.params.id)
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' })
    res.json(pipeline)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router