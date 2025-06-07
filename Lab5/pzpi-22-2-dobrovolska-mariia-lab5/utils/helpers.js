// Utility helper functions

const crypto = require('crypto');

/**
 * Generate device ID in format: YYYYMMDD-userId-3RandomChars
 */
const generateDeviceId = (userId) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = crypto.randomBytes(2).toString('hex').slice(0, 3);
  
  return `${dateStr}-${userId}-${randomChars}`;
};

/**
 * Validate device ID format
 */
const isValidDeviceId = (deviceId) => {
  const deviceIdRegex = /^\d{8}-[a-zA-Z0-9]{24}-[a-zA-Z0-9]{3}$/;
  return deviceIdRegex.test(deviceId);
};

/**
 * Extract user ID from device ID
 */
const extractUserIdFromDeviceId = (deviceId) => {
  if (!isValidDeviceId(deviceId)) {
    throw new Error('Invalid device ID format');
  }
  
  return deviceId.split('-')[1];
};

/**
 * Calculate temperature status
 */
const getTemperatureStatus = (current, target, tolerance = 0.5) => {
  const diff = Math.abs(current - target);
  
  if (diff <= tolerance) return 'optimal';
  if (diff <= tolerance * 2) return 'acceptable';
  return 'critical';
};

/**
 * Calculate humidity status
 */
const getHumidityStatus = (current, target, tolerance = 5) => {
  const diff = Math.abs(current - target);
  
  if (diff <= tolerance) return 'optimal';
  if (diff <= tolerance * 2) return 'acceptable';
  return 'critical';
};

/**
 * Format sensor data for display
 */
const formatSensorData = (data) => {
  return {
    temperature: `${data.temperature.toFixed(1)}°C`,
    humidity: `${data.humidity.toFixed(1)}%`,
    lightLevel: data.lightLevel,
    timestamp: data.timestamp.toISOString(),
    status: {
      temperature: getTemperatureStatus(data.temperature, data.targetTemperature),
      humidity: getHumidityStatus(data.humidity, data.targetHumidity)
    }
  };
};

/**
 * Calculate device uptime percentage
 */
const calculateUptime = (dataPoints, expectedDataPoints) => {
  if (expectedDataPoints === 0) return 0;
  return Math.min(100, (dataPoints / expectedDataPoints) * 100);
};

/**
 * Get time ago string
 */
const timeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
};

/**
 * Sanitize object for logging (remove sensitive data)
 */
const sanitizeForLogging = (obj) => {
  const sanitized = { ...obj };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Generate random API key
 */
const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate temperature range
 */
const isValidTemperature = (temp) => {
  return typeof temp === 'number' && temp >= -50 && temp <= 100;
};

/**
 * Validate humidity range
 */
const isValidHumidity = (humidity) => {
  return typeof humidity === 'number' && humidity >= 0 && humidity <= 100;
};

/**
 * Calculate alert priority based on deviation
 */
const calculateAlertPriority = (current, target, tolerance) => {
  const deviation = Math.abs(current - target);
  const deviationRatio = deviation / tolerance;
  
  if (deviationRatio <= 1) return 'LOW';
  if (deviationRatio <= 2) return 'MEDIUM';
  if (deviationRatio <= 3) return 'HIGH';
  return 'CRITICAL';
};

/**
 * Format number with proper precision
 */
const formatNumber = (num, decimals = 1) => {
  if (typeof num !== 'number') return 'N/A';
  return Number(num.toFixed(decimals));
};

/**
 * Check if device is online based on last seen
 */
const isDeviceOnline = (lastSeen, thresholdMinutes = 5) => {
  if (!lastSeen) return false;
  const now = new Date();
  const threshold = thresholdMinutes * 60 * 1000; // Convert to milliseconds
  return (now - new Date(lastSeen)) < threshold;
};

/**
 * Calculate date range for queries
 */
const getDateRange = (days) => {
  const end = new Date();
  const start = new Date(end.getTime() - (days * 24 * 60 * 60 * 1000));
  return { start, end };
};

/**
 * Generate incubation schedule
 */
const generateIncubationSchedule = (startDate = new Date()) => {
  const schedule = [];
  const start = new Date(startDate);
  
  // Days 1-18: High humidity, turning enabled
  for (let day = 1; day <= 18; day++) {
    const date = new Date(start.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
    schedule.push({
      day,
      date: date.toISOString().split('T')[0],
      stage: 'incubation',
      temperature: 37.5,
      humidity: 60,
      turning: true,
      notes: 'Regular incubation period'
    });
  }
  
  // Days 19-21: Lower humidity, no turning (lockdown)
  for (let day = 19; day <= 21; day++) {
    const date = new Date(start.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
    schedule.push({
      day,
      date: date.toISOString().split('T')[0],
      stage: 'lockdown',
      temperature: 37.2,
      humidity: 70,
      turning: false,
      notes: day === 21 ? 'Hatching day!' : 'Lockdown period - no turning'
    });
  }
  
  return schedule;
};

/**
 * Calculate estimated hatch date
 */
const calculateHatchDate = (startDate) => {
  const start = new Date(startDate);
  const hatchDate = new Date(start.getTime() + (21 * 24 * 60 * 60 * 1000));
  return hatchDate;
};

/**
 * Get current incubation day
 */
const getCurrentIncubationDay = (startDate) => {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = now - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(21, diffDays));
};

module.exports = {
  generateDeviceId,
  isValidDeviceId,
  extractUserIdFromDeviceId,
  getTemperatureStatus,
  getHumidityStatus,
  formatSensorData,
  calculateUptime,
  timeAgo,
  sanitizeForLogging,
  generateApiKey,
  isValidTemperature,
  isValidHumidity,
  calculateAlertPriority,
  formatNumber,
  isDeviceOnline,
  getDateRange,
  generateIncubationSchedule,
  calculateHatchDate,
  getCurrentIncubationDay
};