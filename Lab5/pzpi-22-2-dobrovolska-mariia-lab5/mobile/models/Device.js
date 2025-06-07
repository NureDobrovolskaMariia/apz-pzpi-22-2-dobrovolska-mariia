const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Chicken Incubator'
  },
  type: {
    type: String,
    default: 'chicken_incubator'
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'error'],
    default: 'offline'
  },
  location: {
    type: String,
    default: 'Farm'
  },
  settings: {
    targetTemperature: {
      type: Number,
      default: 37.5,
      min: 30,
      max: 45
    },
    targetHumidity: {
      type: Number,
      default: 60.0,
      min: 30,
      max: 80
    },
    autoMode: {
      type: Boolean,
      default: true
    },
    turningEnabled: {
      type: Boolean,
      default: true
    },
    turningInterval: {
      type: Number,
      default: 3600000 // 1 hour in milliseconds
    }
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  firmware: {
    type: String,
    default: '1.0.0'
  },
  ipAddress: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Device', deviceSchema);