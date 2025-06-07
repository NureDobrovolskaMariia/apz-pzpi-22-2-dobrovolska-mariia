const SensorData = require('../models/SensorData');
const Device = require('../models/Device');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Get sensor data for a specific device
const getDeviceData = catchAsync(async (req, res, next) => {
  const { deviceId } = req.params;
  const { page = 1, limit = 100, startDate, endDate } = req.query;
  
  // Verify device ownership
  const device = await Device.findOne({
    deviceId,
    userId: req.user.id,
    isActive: true
  });
  
  if (!device) {
    return next(new AppError('Device not found', 404));
  }
  
  // Build query
  const query = { deviceId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Get data with pagination
  const data = await SensorData.find(query)
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip(skip)
    .select('-__v');
  
  // Get total count for pagination
  const total = await SensorData.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: data.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      sensorData: data
    }
  });
});

// Get latest sensor data for all user devices
const getLatestData = catchAsync(async (req, res, next) => {
  // Get user's devices
  const devices = await Device.find({
    userId: req.user.id,
    isActive: true
  }).select('deviceId name status');
  
  if (devices.length === 0) {
    return res.status(200).json({
      status: 'success',
      results: 0,
      data: {
        devices: []
      }
    });
  }
  
  // Get latest data for each device
  const deviceData = await Promise.all(
    devices.map(async (device) => {
      const latestData = await SensorData.findOne({
        deviceId: device.deviceId
      }).sort({ timestamp: -1 });
      
      return {
        device: {
          id: device.deviceId,
          name: device.name,
          status: device.status
        },
        data: latestData
      };
    })
  );
  
  res.status(200).json({
    status: 'success',
    results: deviceData.length,
    data: {
      devices: deviceData
    }
  });
});

// Get aggregated data (hourly, daily, weekly)
const getAggregatedData = catchAsync(async (req, res, next) => {
  const { deviceId } = req.params;
  const { period = 'hourly', startDate, endDate } = req.query;
  
  // Verify device ownership
  const device = await Device.findOne({
    deviceId,
    userId: req.user.id,
    isActive: true
  });
  
  if (!device) {
    return next(new AppError('Device not found', 404));
  }
  
  // Set default date range if not provided
  const now = new Date();
  const defaultStartDate = startDate ? new Date(startDate) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const defaultEndDate = endDate ? new Date(endDate) : now;
  
  // Determine grouping format based on period
  let groupFormat;
  switch (period) {
    case 'hourly':
      groupFormat = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      };
      break;
    case 'daily':
      groupFormat = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      };
      break;
    case 'weekly':
      groupFormat = {
        year: { $year: '$timestamp' },
        week: { $week: '$timestamp' }
      };
      break;
    default:
      return next(new AppError('Invalid period. Use: hourly, daily, or weekly', 400));
  }
  
  const aggregatedData = await SensorData.aggregate([
    {
      $match: {
        deviceId,
        timestamp: {
          $gte: defaultStartDate,
          $lte: defaultEndDate
        }
      }
    },
    {
      $group: {
        _id: groupFormat,
        avgTemperature: { $avg: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        avgLightLevel: { $avg: '$lightLevel' },
        minTemperature: { $min: '$temperature' },
        maxTemperature: { $max: '$temperature' },
        minHumidity: { $min: '$humidity' },
        maxHumidity: { $max: '$humidity' },
        dataPoints: { $sum: 1 },
        firstTimestamp: { $min: '$timestamp' },
        lastTimestamp: { $max: '$timestamp' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
  
  res.status(200).json({
    status: 'success',
    period,
    dateRange: {
      start: defaultStartDate,
      end: defaultEndDate
    },
    results: aggregatedData.length,
    data: {
      aggregatedData
    }
  });
});

// Get data statistics
const getDataStatistics = catchAsync(async (req, res, next) => {
  const { deviceId } = req.params;
  const { days = 7 } = req.query;
  
  // Verify device ownership
  const device = await Device.findOne({
    deviceId,
    userId: req.user.id,
    isActive: true
  });
  
  if (!device) {
    return next(new AppError('Device not found', 404));
  }
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const stats = await SensorData.aggregate([
    {
      $match: {
        deviceId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalDataPoints: { $sum: 1 },
        avgTemperature: { $avg: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        avgLightLevel: { $avg: '$lightLevel' },
        minTemperature: { $min: '$temperature' },
        maxTemperature: { $max: '$temperature' },
        minHumidity: { $min: '$humidity' },
        maxHumidity: { $max: '$humidity' },
        minLightLevel: { $min: '$lightLevel' },
        maxLightLevel: { $max: '$lightLevel' },
        firstReading: { $min: '$timestamp' },
        lastReading: { $max: '$timestamp' }
      }
    }
  ]);
  
  // Calculate temperature and humidity variance
  const variance = await SensorData.aggregate([
    {
      $match: {
        deviceId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        tempVariance: { $stdDevPop: '$temperature' },
        humidityVariance: { $stdDevPop: '$humidity' }
      }
    }
  ]);
  
  const result = stats[0] || {};
  if (variance[0]) {
    result.temperatureStdDev = variance[0].tempVariance;
    result.humidityStdDev = variance[0].humidityVariance;
  }
  
  res.status(200).json({
    status: 'success',
    period: `${days} days`,
    data: {
      statistics: result
    }
  });
});

// Export data (CSV format)
const exportData = catchAsync(async (req, res, next) => {
  const { deviceId } = req.params;
  const { startDate, endDate, format = 'json' } = req.query;
  
  // Verify device ownership
  const device = await Device.findOne({
    deviceId,
    userId: req.user.id,
    isActive: true
  });
  
  if (!device) {
    return next(new AppError('Device not found', 404));
  }
  
  // Build query
  const query = { deviceId };
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  // Limit export to prevent large downloads
  const data = await SensorData.find(query)
    .sort({ timestamp: -1 })
    .limit(10000) // Limit to 10k records
    .select('temperature humidity lightLevel timestamp -_id');
  
  if (format === 'csv') {
    // Convert to CSV
    const csvHeader = 'timestamp,temperature,humidity,lightLevel\n';
    const csvData = data.map(row => 
      `${row.timestamp.toISOString()},${row.temperature},${row.humidity},${row.lightLevel}`
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${deviceId}-data.csv"`);
    res.send(csvHeader + csvData);
  } else {
    // Return JSON
    res.status(200).json({
      status: 'success',
      deviceId,
      exportedAt: new Date().toISOString(),
      results: data.length,
      data: {
        sensorData: data
      }
    });
  }
});

// Get real-time data summary
const getRealTimeSummary = catchAsync(async (req, res, next) => {
  // Get all user devices
  const devices = await Device.find({
    userId: req.user.id,
    isActive: true
  });
  
  if (devices.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalDevices: 0,
          onlineDevices: 0,
          offlineDevices: 0,
          devices: []
        }
      }
    });
  }
  
  // Get latest data for each device
  const deviceSummaries = await Promise.all(
    devices.map(async (device) => {
      const latestData = await SensorData.findOne({
        deviceId: device.deviceId
      }).sort({ timestamp: -1 });
      
      const isOnline = device.status === 'online' && 
        latestData && 
        (new Date() - latestData.timestamp) < 5 * 60 * 1000; // 5 minutes
      
      return {
        deviceId: device.deviceId,
        name: device.name,
        status: isOnline ? 'online' : 'offline',
        location: device.location,
        latestData: latestData ? {
          temperature: latestData.temperature,
          humidity: latestData.humidity,
          lightLevel: latestData.lightLevel,
          timestamp: latestData.timestamp
        } : null,
        lastSeen: device.lastSeen
      };
    })
  );
  
  const onlineCount = deviceSummaries.filter(d => d.status === 'online').length;
  
  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalDevices: devices.length,
        onlineDevices: onlineCount,
        offlineDevices: devices.length - onlineCount,
        lastUpdated: new Date().toISOString(),
        devices: deviceSummaries
      }
    }
  });
});

module.exports = {
  getDeviceData,
  getLatestData,
  getAggregatedData,
  getDataStatistics,
  exportData,
  getRealTimeSummary
};