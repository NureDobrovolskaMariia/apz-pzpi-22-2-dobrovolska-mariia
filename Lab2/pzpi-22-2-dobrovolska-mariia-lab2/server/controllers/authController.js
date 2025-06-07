const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Send response with token
const createSendToken = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: {
      user
    }
  });
};

// Register new user
const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }
  
  // Create new user
  const newUser = await User.create({
    name,
    email,
    password
  });
  
  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(newUser);
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
    // Don't fail registration if email fails
  }
  
  createSendToken(newUser, 201, res, 'User registered successfully');
});

// Login user
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  
  // Check if user exists and password is correct
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  
  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 401));
  }
  
  createSendToken(user, 200, res, 'Logged in successfully');
});

// Get current user profile
const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('devices', 'deviceId name status lastSeen location');
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Update user profile
const updateProfile = catchAsync(async (req, res, next) => {
  const { name, emailNotifications, alertSettings } = req.body;
  
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
  if (alertSettings !== undefined) updateData.alertSettings = alertSettings;
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// Change password
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return next(new AppError('Current password and new password are required', 400));
  }
  
  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters long', 400));
  }
  
  // Get user with password
  const user = await User.findById(req.user.id).select('+password');
  
  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 400));
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  createSendToken(user, 200, res, 'Password changed successfully');
});

// Deactivate account
const deactivateAccount = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false });
  
  res.status(200).json({
    status: 'success',
    message: 'Account deactivated successfully'
  });
});

// Get user statistics
const getUserStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // Get device count
  const deviceCount = await User.findById(userId)
    .populate('devices')
    .then(user => user.devices.length);
  
  // Get recent alerts count (last 7 days)
  const Alert = require('../models/Alert');
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentAlertsCount = await Alert.countDocuments({
    userId: userId,
    createdAt: { $gte: sevenDaysAgo }
  });
  
  // Get unresolved alerts count
  const unresolvedAlertsCount = await Alert.countDocuments({
    userId: userId,
    isResolved: false
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      deviceCount,
      recentAlertsCount,
      unresolvedAlertsCount,
      memberSince: req.user.createdAt
    }
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount,
  getUserStats
};