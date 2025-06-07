const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['TEMPERATURE', 'HUMIDITY', 'DEVICE_OFFLINE', 'SENSOR_ERROR'],
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  message: {
    type: String,
    required: true
  },
  currentValue: {
    type: Number
  },
  targetValue: {
    type: Number
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  metadata: {
    temperature: Number,
    humidity: Number,
    lightLevel: Number
  }
}, {
  timestamps: true
});

// Index for efficient querying
alertSchema.index({ deviceId: 1, createdAt: -1 });
alertSchema.index({ userId: 1, isResolved: 1, createdAt: -1 });

// TTL index to automatically delete resolved alerts after 90 days
alertSchema.index({ resolvedAt: 1 }, { expireAfterSeconds: 7776000, partialFilterExpression: { isResolved: true } });

module.exports = mongoose.model('Alert', alertSchema);