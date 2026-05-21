const { Schema, model } = require('mongoose')

const stepSchema = new Schema({
  name:       { type: String, required: true },
  status:     { type: String, enum: ['pending', 'running', 'passed', 'failed'], default: 'pending' },
  startedAt:  Date,
  finishedAt: Date,
  exitCode:   Number,
  duration:   Number
}, { _id: false })

const jobSchema = new Schema({
  pipeline: {
    type: Schema.Types.ObjectId,
    ref: 'Pipeline',
    required: true
  },
  status: {
    type: String,
    enum: ['queued', 'running', 'passed', 'failed'],
    default: 'queued'
  },
  commitSha:   String,
  triggeredBy: String,
  steps:       [stepSchema],
  startedAt:   Date,
  finishedAt:  Date
}, { timestamps: true })

module.exports = model('Job', jobSchema)