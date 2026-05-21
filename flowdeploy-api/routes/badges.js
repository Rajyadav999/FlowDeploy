const router = require('express').Router()
const Job = require('../models/Job')
const Pipeline = require('../models/Pipeline')

// colour map
const COLOURS = {
  passed:  { bg: '#00ff88', text: '#003322', label: 'passing' },
  failed:  { bg: '#ff4455', text: '#330011', label: 'failing' },
  running: { bg: '#ffcc00', text: '#332200', label: 'running' },
  queued:  { bg: '#4488ff', text: '#001133', label: 'queued'  },
  unknown: { bg: '#444444', text: '#cccccc', label: 'unknown' },
}

function buildSVG(status, pipelineName) {
  const c        = COLOURS[status] || COLOURS.unknown
  const label    = 'flowdeploy'
  const value    = c.label
  const labelW   = 90
  const valueW   = value.length * 7 + 20
  const totalW   = labelW + valueW

  router.get('/:pipelineId', async (req, res) => {
  try {
    // allow any origin to load this badge as an image
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    const pipeline = await Pipeline.findById(req.params.pipelineId)
    if (!pipeline) {
      return res.send(buildSVG('unknown', 'unknown'))
    }

    const latestJob = await Job
      .findOne({ pipeline: req.params.pipelineId })
      .sort({ createdAt: -1 })

    const status = latestJob?.status || 'unknown'
    res.send(buildSVG(status, pipeline.name))

  } catch (err) {
    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(buildSVG('unknown', 'error'))
  }
})
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20">
  <title>${pipelineName} — ${value}</title>

  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".15"/>
      <stop offset="1" stop-opacity=".15"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="${totalW}" height="20" rx="4"/>
    </clipPath>
  </defs>

  <g clip-path="url(#r)">
    <!-- left label background -->
    <rect width="${labelW}" height="20" fill="#1a1a1a"/>
    <!-- right value background -->
    <rect x="${labelW}" width="${valueW}" height="20" fill="${c.bg}"/>
    <!-- shine overlay -->
    <rect width="${totalW}" height="20" fill="url(#s)"/>
  </g>

  <!-- left label text -->
  <text
    x="${labelW / 2}" y="14"
    font-family="JetBrains Mono,DejaVu Sans Mono,monospace"
    font-size="11" fill="#ffffff"
    text-anchor="middle"
    letter-spacing="0.5"
  >${label}</text>

  <!-- right value text -->
  <text
    x="${labelW + valueW / 2}" y="14"
    font-family="JetBrains Mono,DejaVu Sans Mono,monospace"
    font-size="11" fill="${c.text}"
    font-weight="600"
    text-anchor="middle"
    letter-spacing="0.5"
  >${value}</text>
</svg>`
}

// GET /api/badges/:pipelineId — no auth, public endpoint
router.get('/:pipelineId', async (req, res) => {
  try {
    const pipeline = await Pipeline.findById(req.params.pipelineId)
    if (!pipeline) {
      const svg = buildSVG('unknown', 'unknown')
      res.setHeader('Content-Type', 'image/svg+xml')
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      return res.send(svg)
    }

    // get the latest job for this pipeline
    const latestJob = await Job
      .findOne({ pipeline: req.params.pipelineId })
      .sort({ createdAt: -1 })

    const status = latestJob?.status || 'unknown'
    const svg    = buildSVG(status, pipeline.name)

    // no caching — badge must always be live
    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.send(svg)

  } catch (err) {
    const svg = buildSVG('unknown', 'error')
    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(svg)
  }
})

module.exports = router