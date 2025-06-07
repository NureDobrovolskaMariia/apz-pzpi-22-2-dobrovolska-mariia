const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
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
  temperature: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  lightLevel: {
    type: Number,
    required: true
  },
  targetTemperature: {
    type: Number,
    required: false
  },
  targetHumidity: {
    type: Number,
    required: false
  },
  deviceStatus: {
    heater: { type: Boolean, default: false },
    humidifier: { type: Boolean, default: false },
    fan: { type: Boolean, default: false },
    turner: { type: Boolean, default: false }
  },
  autoMode: {
    type: Boolean,
    default: true
  },
  rssi: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
sensorDataSchema.index({ deviceId: 1, timestamp: -1 });
sensorDataSchema.index({ userId: 1, timestamp: -1 });

// TTL index to automatically delete old data after 30 days
sensorDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('SensorData', sensorDataSchema);