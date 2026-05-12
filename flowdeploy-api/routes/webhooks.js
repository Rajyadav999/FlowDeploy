const router = require('express').Router()
const crypto = require('crypto')
const Pipeline = require('../models/Pipeline')
const Job = require('../models/Job')

function verifySignature(req) {
  const sig = req.headers['x-hub-signature-256']
  if (!sig) return false
  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(sig),
    Buffer.from(digest)
  )
}

router.post('/github',
  require('express').raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      req.rawBody = req.body
      const payload = JSON.parse(req.body.toString())

      if (!verifySignature(req)) {
        return res.status(401).json({ error: 'Invalid signature' })
      }

      const event = req.headers['x-github-event']
      if (event !== 'push') return res.json({ message: 'Ignored' })

      const repoUrl = payload.repository?.html_url
      const branch  = payload.ref?.replace('refs/heads/', '')
      const sha     = payload.after

      const pipeline = await Pipeline.findOne({
        repoUrl, branch, isActive: true
      })
      if (!pipeline) return res.json({ message: 'No matching pipeline' })

      const job = await Job.create({
        pipeline: pipeline._id,
        commitSha: sha,
        triggeredBy: 'webhook',
        status: 'queued'
      })

      res.status(201).json({ message: 'Job queued', jobId: job._id })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
)

module.exports = router