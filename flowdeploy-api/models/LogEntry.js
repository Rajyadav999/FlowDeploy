const { Schema, model } = require('mongoose')

const logEntrySchema = new Schema({
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  stepName: String,
  line: {
    type: String,
    required: true
  },
  stream: {
    type: String,
    enum: ['stdout', 'stderr'],
    default: 'stdout'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
})

module.exports = model('LogEntry', logEntrySchema)