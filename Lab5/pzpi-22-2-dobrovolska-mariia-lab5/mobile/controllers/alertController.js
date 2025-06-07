const Alert = require('../models/Alert');
const Device = require('../models/Device');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Get all alerts for user
const getUserAlerts = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 50, severity, type, isResolved, deviceId } = req.query;
  
  // Build query
  const query = { userId: req.user.id };
  
  if (severity) query.severity = severity;
  if (type) query.type = type;
  if (isResolved !== undefined) query.isResolved = isResolved === 'true';
  if (deviceId) query.deviceId = deviceId;
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Get alerts with pagination
  const alerts = await Alert.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip(skip)
    .populate({
      path: 'deviceId',
      select: 'name location',
      match: { isActive: true }
    });
  
  // Get total count for pagination
  const total = await Alert.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: alerts.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      alerts
    }
  });
});

// Get single alert by ID
const getAlert = catchAsync(async (req, res, next) => {
  const alert = await Alert.findOne({
    _id: req.params.alertId,
    userId: req.user.id
  });
  
  if (!alert) {
    return next(new AppError('Alert not found', 404));
  }
  
  // Get device info
  const device = await Device.findOne({ deviceId: alert.deviceId });
  
  res.status(200).json({
    status: 'success',
    data: {
      alert,
      device: device ? {
        name: device.name,
        location: device.location
      } : null
    }
  });
});

// Mark alert as resolved
const resolveAlert = catchAsync(async (req, res, next) => {
  const alert = await Alert.findOne({
    _id: req.params.alertId,
    userId: req.user.id
  });
  
  if (!alert) {
    return next(new AppError('Alert not found', 404));
  }
  
  if (alert.isResolved) {
    return next(new AppError('Alert is already resolved', 400));
  }
  
  alert.isResolved = true;
  alert.resolvedAt = new Date();
  await alert.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Alert marked as resolved',
    data: {
      alert
    }
  });
});

// Resolve multiple alerts
const resolveMultipleAlerts = catchAsync(async (req, res, next) => {
  const { alertIds } = req.body;
  
  if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
    return next(new AppError('Alert IDs array is required', 400));
  }
  
  const result = await Alert.updateMany(
    {
      _id: { $in: alertIds },
      userId: req.user.id,
      isResolved: false
    },
    {
      isResolved: true,
      resolvedAt: new Date()
    }
  );
  
  res.status(200).json({
    status: 'success',
    message: `${result.modifiedCount} alerts resolved`,
    data: {
      resolvedCount: result.modifiedCount,
      totalRequested: alertIds.length
    }
  });
});

// Get alert statistics
const getAlertStatistics = catchAsync(async (req, res, next) => {
  const { days = 30 } = req.query;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  // Alert counts by type
  const alertsByType = await Alert.aggregate([
    {
      $match: {
        userId: req.user._id,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        unresolved: {
          $sum: { $cond: [{ $eq: ['$isResolved', false] }, 1, 0] }
        }
      }
    }
  ]);
  
  // Alert counts by severity
  const alertsBySeverity = await Alert.aggregate([
    {
      $match: {
        userId: req.user._id,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 },
        unresolved: {
          $sum: { $cond: [{ $eq: ['$isResolved', false] }, 1, 0] }
        }
      }
    }
  ]);
  
  // Alert counts by device
  const alertsByDevice = await Alert.aggregate([
    {
      $match: {
        userId: req.user._id,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$deviceId',
        count: { $sum: 1 },
        unresolved: {
          $sum: { $cond: [{ $eq: ['$isResolved', false] }, 1, 0] }
        },
        lastAlert: { $max: '$createdAt' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  // Add device names to device statistics
  const devicesWithNames = await Promise.all(
    alertsByDevice.map(async (item) => {
      const device = await Device.findOne({ deviceId: item._id });
      return {
        ...item,
        deviceName: device ? device.name : 'Unknown Device'
      };
    })
  );
  
  // Daily alert trend
  const dailyTrend = await Alert.aggregate([
    {
      $match: {
        userId: req.user._id,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
  
  // Total counts
  const totalAlerts = await Alert.countDocuments({
    userId: req.user.id,
    createdAt: { $gte: startDate }
  });
  
  const unresolvedAlerts = await Alert.countDocuments({
    userId: req.user.id,
    isResolved: false
  });
  
  res.status(200).json({
    status: 'success',
    period: `${days} days`,
    data: {
      summary: {
        totalAlerts,
        unresolvedAlerts,
        resolvedAlerts: totalAlerts - unresolvedAlerts
      },
      byType: alertsByType,
      bySeverity: alertsBySeverity,
      byDevice: devicesWithNames,
      dailyTrend
    }
  });
});

// Get recent critical alerts
const getCriticalAlerts = catchAsync(async (req, res, next) => {
  const criticalAlerts = await Alert.find({
    userId: req.user.id,
    severity: { $in: ['HIGH', 'CRITICAL'] },
    isResolved: false
  })
    .sort({ createdAt: -1 })
    .limit(10);
  
  // Add device names
  const alertsWithDevices = await Promise.all(
    criticalAlerts.map(async (alert) => {
      const device = await Device.findOne({ deviceId: alert.deviceId });
      return {
        ...alert.toObject(),
        deviceName: device ? device.name : 'Unknown Device'
      };
    })
  );
  
  res.status(200).json({
    status: 'success',
    results: alertsWithDevices.length,
    data: {
      criticalAlerts: alertsWithDevices
    }
  });
});

// Delete resolved alerts (cleanup)
const deleteResolvedAlerts = catchAsync(async (req, res, next) => {
  const { olderThanDays = 30 } = req.query;
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  
  const result = await Alert.deleteMany({
    userId: req.user.id,
    isResolved: true,
    resolvedAt: { $lt: cutoffDate }
  });
  
  res.status(200).json({
    status: 'success',
    message: `${result.deletedCount} resolved alerts deleted`,
    data: {
      deletedCount: result.deletedCount,
      cutoffDate
    }
  });
});

// Create manual alert (for testing or manual notifications)
const createAlert = catchAsync(async (req, res, next) => {
  const { deviceId, type, severity, message } = req.body;
  
  // Verify device ownership
  const device = await Device.findOne({
    deviceId,
    userId: req.user.id,
    isActive: true
  });
  
  if (!device) {
    return next(new AppError('Device not found', 404));
  }
  
  const alert = await Alert.create({
    deviceId,
    userId: req.user.id,
    type,
    severity: severity || 'MEDIUM',
    message
  });
  
  res.status(201).json({
    status: 'success',
    message: 'Alert created successfully',
    data: {
      alert
    }
  });
});

module.exports = {
  getUserAlerts,
  getAlert,
  resolveAlert,
  resolveMultipleAlerts,
  getAlertStatistics,
  getCriticalAlerts,
  deleteResolvedAlerts,
  createAlert
};