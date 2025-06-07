const User = require('../models/User');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const SensorData = require('../models/SensorData');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Get all users (admin only)
const getAllUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, search, role, isActive } = req.query;
  
  // Build query
  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Get users with pagination
  const users = await User.find(query)
    .select('-password')
    .populate('devices', 'deviceId name status')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip(skip);
  
  // Get total count for pagination
  const total = await User.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      users
    }
  });
});

// Get single user by ID (admin only)
const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId)
    .select('-password')
    .populate('devices');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Get user statistics
  const deviceCount = user.devices.length;
  const alertsCount = await Alert.countDocuments({ userId: user._id });
  const unresolvedAlertsCount = await Alert.countDocuments({ 
    userId: user._id, 
    isResolved: false 
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      user,
      statistics: {
        deviceCount,
        totalAlerts: alertsCount,
        unresolvedAlerts: unresolvedAlertsCount,
        memberSince: user.createdAt
      }
    }
  });
});

// Update user (admin only)
const updateUser = catchAsync(async (req, res, next) => {
  const { name, email, role, isActive, emailNotifications, alertSettings } = req.body;
  
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
  }
  
  // Update fields
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
  if (alertSettings !== undefined) {
    user.alertSettings = { ...user.alertSettings, ...alertSettings };
  }
  
  await user.save();
  
  res.status(200).json({
    status: 'success',
    message: 'User updated successfully',
    data: {
      user
    }
  });
});

// Delete user (admin only)
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Don't allow deletion of the last admin
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
    if (adminCount <= 1) {
      return next(new AppError('Cannot delete the last admin user', 400));
    }
  }
  
  // Soft delete - deactivate user instead of deleting
  user.isActive = false;
  await user.save();
  
  // Also deactivate user's devices
  await Device.updateMany(
    { userId: user._id },
    { isActive: false }
  );
  
  res.status(200).json({
    status: 'success',
    message: 'User deactivated successfully'
  });
});

// Get user activity (admin only)
const getUserActivity = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { days = 30 } = req.query;
  
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  // Get user's devices
  const userDevices = await Device.find({ userId });
  const deviceIds = userDevices.map(d => d.deviceId);
  
  // Recent sensor data activity
  const dataActivity = await SensorData.aggregate([
    {
      $match: {
        deviceId: { $in: deviceIds },
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        dataPoints: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
  
  // Recent alerts
  const recentAlerts = await Alert.find({
    userId,
    createdAt: { $gte: startDate }
  })
    .sort({ createdAt: -1 })
    .limit(20);
  
  // Device status summary
  const deviceSummary = userDevices.map(device => ({
    deviceId: device.deviceId,
    name: device.name,
    status: device.status,
    lastSeen: device.lastSeen,
    location: device.location
  }));
  
  res.status(200).json({
    status: 'success',
    period: `${days} days`,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      activity: {
        dataActivity,
        recentAlerts,
        deviceSummary,
        totalDevices: userDevices.length,
        activeDevices: userDevices.filter(d => d.status === 'online').length
      }
    }
  });
});

// Get platform statistics (admin only)
const getPlatformStats = catchAsync(async (req, res, next) => {
  const { days = 30 } = req.query;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  // User statistics
  const totalUsers = await User.countDocuments({ isActive: true });
  const newUsers = await User.countDocuments({
    isActive: true,
    createdAt: { $gte: startDate }
  });
  const adminUsers = await User.countDocuments({ role: 'admin', isActive: true });
  
  // Device statistics
  const totalDevices = await Device.countDocuments({ isActive: true });
  const onlineDevices = await Device.countDocuments({ status: 'online', isActive: true });
  const newDevices = await Device.countDocuments({
    isActive: true,
    createdAt: { $gte: startDate }
  });
  
  // Alert statistics
  const totalAlerts = await Alert.countDocuments({
    createdAt: { $gte: startDate }
  });
  const unresolvedAlerts = await Alert.countDocuments({ isResolved: false });
  const criticalAlerts = await Alert.countDocuments({
    severity: 'CRITICAL',
    isResolved: false
  });
  
  // Data volume statistics
  const dataVolume = await SensorData.countDocuments({
    timestamp: { $gte: startDate }
  });
  
  // Daily registration trend
  const userRegistrationTrend = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        isActive: true
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
  
  res.status(200).json({
    status: 'success',
    period: `${days} days`,
    data: {
      users: {
        total: totalUsers,
        new: newUsers,
        admins: adminUsers
      },
      devices: {
        total: totalDevices,
        online: onlineDevices,
        offline: totalDevices - onlineDevices,
        new: newDevices
      },
      alerts: {
        total: totalAlerts,
        unresolved: unresolvedAlerts,
        critical: criticalAlerts
      },
      data: {
        volume: dataVolume,
        avgPerDay: Math.round(dataVolume / days)
      },
      trends: {
        userRegistrations: userRegistrationTrend
      }
    }
  });
});

// Promote user to admin
const promoteToAdmin = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  if (user.role === 'admin') {
    return next(new AppError('User is already an admin', 400));
  }
  
  user.role = 'admin';
  await user.save();
  
  res.status(200).json({
    status: 'success',
    message: 'User promoted to admin successfully',
    data: {
      user
    }
  });
});

// Get user's data export (admin only)
const exportUserData = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId).select('-password');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Get all user data
  const devices = await Device.find({ userId });
  const alerts = await Alert.find({ userId }).sort({ createdAt: -1 });
  
  // Get recent sensor data (limit to last 1000 records to prevent huge exports)
  const sensorData = await SensorData.find({
    userId: user._id
  })
    .sort({ timestamp: -1 })
    .limit(1000);
  
  const exportData = {
    user: user.toObject(),
    devices: devices.map(d => d.toObject()),
    alerts: alerts.map(a => a.toObject()),
    sensorData: sensorData.map(s => s.toObject()),
    exportedAt: new Date().toISOString(),
    exportedBy: req.user.id
  };
  
  res.status(200).json({
    status: 'success',
    message: 'User data exported successfully',
    data: exportData
  });
});

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserActivity,
  getPlatformStats,
  promoteToAdmin,
  exportUserData
};