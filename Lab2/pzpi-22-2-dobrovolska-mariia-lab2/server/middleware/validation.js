const mongoose = require('mongoose');

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
const validatePassword = (password) => {
  return password && password.length >= 6;
};

// ObjectId validation
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Device ID validation
const validateDeviceId = (deviceId) => {
  // Format: YYYYMMDD-userId-3RandomSymbols
  const deviceIdRegex = /^\d{8}-[a-zA-Z0-9]{24}-[a-zA-Z0-9]{3}$/;
  return deviceIdRegex.test(deviceId);
};

// User registration validation
const validateUserRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!email || !validateEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!validatePassword(password)) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// User login validation
const validateUserLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validateEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Device validation
const validateDevice = (req, res, next) => {
  const { deviceId, name } = req.body;
  const errors = [];

  if (!deviceId || !validateDeviceId(deviceId)) {
    errors.push('Valid device ID is required (format: YYYYMMDD-userId-3chars)');
  }

  if (!name || name.trim().length < 2) {
    errors.push('Device name must be at least 2 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Device settings validation
const validateDeviceSettings = (req, res, next) => {
  const { settings } = req.body;
  const errors = [];

  if (settings) {
    if (settings.targetTemperature !== undefined) {
      if (typeof settings.targetTemperature !== 'number' || 
          settings.targetTemperature < 30 || 
          settings.targetTemperature > 45) {
        errors.push('Target temperature must be between 30-45°C');
      }
    }

    if (settings.targetHumidity !== undefined) {
      if (typeof settings.targetHumidity !== 'number' || 
          settings.targetHumidity < 30 || 
          settings.targetHumidity > 80) {
        errors.push('Target humidity must be between 30-80%');
      }
    }

    if (settings.turningInterval !== undefined) {
      if (typeof settings.turningInterval !== 'number' || 
          settings.turningInterval < 300000) { // 5 minutes minimum
        errors.push('Turning interval must be at least 5 minutes (300000ms)');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Query parameters validation
const validateQueryParams = (req, res, next) => {
  const { page, limit, startDate, endDate } = req.query;
  const errors = [];

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      errors.push('Limit must be between 1 and 1000');
    }
  }

  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push('Invalid start date format');
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push('Invalid end date format');
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push('Start date must be before end date');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Alert settings validation
const validateAlertSettings = (req, res, next) => {
  const { alertSettings } = req.body;
  const errors = [];

  if (alertSettings) {
    if (alertSettings.temperature) {
      const { min, max } = alertSettings.temperature;
      if (typeof min !== 'number' || typeof max !== 'number' || min >= max) {
        errors.push('Temperature alert range must have valid min < max values');
      }
      if (min < 0 || max > 50) {
        errors.push('Temperature alert range must be between 0-50°C');
      }
    }

    if (alertSettings.humidity) {
      const { min, max } = alertSettings.humidity;
      if (typeof min !== 'number' || typeof max !== 'number' || min >= max) {
        errors.push('Humidity alert range must have valid min < max values');
      }
      if (min < 0 || max > 100) {
        errors.push('Humidity alert range must be between 0-100%');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateDevice,
  validateDeviceSettings,
  validateQueryParams,
  validateAlertSettings,
  validateObjectId,
  validateDeviceId,
  validateEmail,
  validatePassword
};