const Device = require('../models/Device');
const User = require('../models/User');
const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const mqttService = require('../services/mqttService');

// Get all user's devices
const getUserDevices = catchAsync(async (req, res, next) => {
  const devices = await Device.find({ 
    userId: req.user.id,
    isActive: true 
  }).sort({ createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: devices.length,
    data: {
      devices
    }
  });
});

// Get single device by ID
const getDevice = catchAsync(async (req, res, next) => {
  const device = await Device.findOne({
    deviceId: req.params.deviceId,
    userId: req.user.id,
    isActive: true
  });
  
  if (!device) {
    return next(new AppError('Device not found', 404));
  }
  
  // Get latest sensor data
  const latestData = await SensorData.findOne({
    deviceId: device.deviceId
  }).sort({ timestamp: -1 });
  
  // Get recent alerts count
  const alertsCount = await Alert.countDocuments({
    deviceId: device.deviceId,
    isResolved: false
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      device,
      latestData,
      unresolvedAlerts: alertsCount
    }
  });
});

// Register new device
const registerDevice = catchAsync(async (req, res, next) => {
  const { deviceId, name, location } = req.body;
  
  // Check if device already exists
  const existingDevice = await Device.findOne({ deviceId });
  if (existingDevice) {
    return next(new AppError('Device with this ID already exists', 400));
  }
  
  // Extract userId from deviceId (format: YYYYMMDD-userId-3chars)
  const deviceUserId = deviceId.split('-')[1];
  if (deviceUserId !== req.user.id.toString()) {
    return next(new AppError('Device ID does not match your user ID', 400));
  }
  
  // Create device
  const device = await Device.create({
    deviceId,
    userId: req.user.id,
    name: name || 'Chicken Incubator',
    location: location || 'Farm'
  });
  
  // Add device to user's devices array
  await User.findByIdAndUpdate(req.user.id, {
    $push: { devices: device._id }
  });
  
  res.status(201).json({
    status: 'success',
    message: 'Device registered successfully',
    data: {
      device
    }
  });
});

// Update device settings
const updateDevice = catchAsync(async (req, res, next) => {
  const { name, location, settings } = req.body;
  
  const device = await Device.findOne({
    deviceId: req.params.deviceId,
    userId: req.user.id
  });
  
  if (!device) {
    return next(new AppError('Device not found', 404));
  }
  
  // Update fields
  if (name !== undefined) device.name = name;
  if (location !== undefined) device.location = location;
  if (settings !== undefined) {
    device.settings = { ...device.settings, ...settings };
  }
  
  await device.save();
  
  // Send settings to device via MQTT if settings were updated
  if (settings) {
    try {
      mqttService.sendCommand(req.user.id, device.deviceId, {
        target_temperature: device.settings.targetTemperature,
        target_humidity: device.settings.targetHumidity,
        auto_mode: device.settings.autoMode,
        turning_enabled: device.settings.turningEnabled
      });
    } catch (error) {
      console.error('Failed to send settings to device:', error);
      // Don't fail the update if MQTT fails
    }
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Device updated successfully',
    data: {
      device
    }
  });
});

// Delete/deactivate device
const deleteDevice = catchAsync(async (req, res, next) => {
  const device = await Device.findOne({
    deviceId: req.params.deviceId,
    userId: req.user.id
  });
  
  if (!device) {
    return next(new AppError('Device not found', 404));
  }
  
  // Soft delete - mark as inactive
  device.isActive = false;
  await device.save();
  
  // Remove from user's devices array
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { devices: device._id }
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Device removed successfully'
  });
});

// Send command to device
const sendCommand = catchAsync(async (req, res, next) => {
  const { command } = req.body;
  
  if (!command || typeof command !== 'object') {
    return next(new AppError('Valid command object is required', 400));
  }
  
  const device = await Device.findOne({
    deviceId: req.params.deviceId,
    userId: req.user.id,
    isActive: true
  });
  
  if (!device) {
    return next(new AppError('Device not found', 404));
  }
  
  if (device.status === 'offline') {
    return next(new AppError('Cannot send command to offline device', 400));
  }
  
  try {
    mqttService.sendCommand(req.user.id, device.deviceId, command);
    
    res.status(200).json({
      status: 'success',
      message: 'Command sent to device successfully',
      data: {
        deviceId: device.deviceId,
        command
      }
    });
  } catch (error) {
    return next(new AppError('Failed to send command to device', 500));
  }
});

// Get device statistics
const getDeviceStats = catchAsync(async (req, res, next) => {
  const { deviceId } = req.params;
  
  const device = await Device.findOne({
    deviceId,
    userId: req.user.id,
    isActive: true
  });
  
  if (!device) {
    return next(new AppError('Device not found', 404));
  }
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Get uptime percentage (last 24 hours)
  const totalMinutes = 24 * 60;
  const dataPoints = await SensorData.countDocuments({
    deviceId,
    timestamp: { $gte: oneDayAgo }
  });
  const expectedDataPoints = totalMinutes / 0.5; // Data every 30 seconds
  const uptimePercentage = Math.min(100, (dataPoints / expectedDataPoints) * 100);
  
  // Get average conditions (last 24 hours)
  const avgConditions = await SensorData.aggregate([
    {
      $match: {
        deviceId,
        timestamp: { $gte: oneDayAgo }
      }
    },
    {
      $group: {
        _id: null,
        avgTemperature: { $avg: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        avgLightLevel: { $avg: '$lightLevel' },
        minTemperature: { $min: '$temperature' },
        maxTemperature: { $max: '$temperature' },
        minHumidity: { $min: '$humidity' },
        maxHumidity: { $max: '$humidity' }
      }
    }
  ]);
  
  // Get alerts count (last week)
  const alertsCount = await Alert.countDocuments({
    deviceId,
    createdAt: { $gte: oneWeekAgo }
  });
  
  // Get unresolved alerts
  const unresolvedAlerts = await Alert.countDocuments({
    deviceId,
    isResolved: false
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      deviceId,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      averageConditions: avgConditions[0] || null,
      alertsLastWeek: alertsCount,
      unresolvedAlerts,
      deviceAge: Math.floor((now - device.createdAt) / (1000 * 60 * 60 * 24)), // days
      lastSeen: device.lastSeen
    }
  });
});

// Quick device actions
const quickActions = catchAsync(async (req, res, next) => {
  const { action } = req.body;
  const { deviceId } = req.params;
  
  const device = await Device.findOne({
    deviceId,
    userId: req.user.id,
    isActive: true
  });
  
  if (!device) {
    return next(new AppError('Device not found', 404));
  }
  
  let command = {};
  
  switch (action) {
    case 'turn_eggs':
      command = { turn_eggs: true };
      break;
    case 'enable_auto':
      command = { auto_mode: true };
      break;
    case 'disable_auto':
      command = { auto_mode: false };
      break;
    case 'emergency_stop':
      command = { 
        auto_mode: false, 
        heater: false, 
        humidifier: false 
      };
      break;
    default:
      return next(new AppError('Invalid action', 400));
  }
  
  try {
    mqttService.sendCommand(req.user.id, deviceId, command);
    
    res.status(200).json({
      status: 'success',
      message: `Action '${action}' executed successfully`,
      data: { action, command }
    });
  } catch (error) {
    return next(new AppError('Failed to execute action', 500));
  }
});

module.exports = {
  getUserDevices,
  getDevice,
  registerDevice,
  updateDevice,
  deleteDevice,
  sendCommand,
  getDeviceStats,
  quickActions
};