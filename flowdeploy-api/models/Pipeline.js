const { Schema, model } = require('mongoose')

const pipelineSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  repoUrl: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    default: 'main'
  },
  yamlContent: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

module.exports = model('Pipeline', pipelineSchema)