// Application constants

// User roles
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Device statuses
const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  ERROR: 'error'
};

// Alert types
const ALERT_TYPES = {
  TEMPERATURE: 'TEMPERATURE',
  HUMIDITY: 'HUMIDITY',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  SENSOR_ERROR: 'SENSOR_ERROR'
};

// Alert severities
const ALERT_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Sensor data limits
const SENSOR_LIMITS = {
  TEMPERATURE: {
    MIN: -50,
    MAX: 100,
    OPTIMAL_MIN: 36.0,
    OPTIMAL_MAX: 39.0,
    TOLERANCE: 0.5
  },
  HUMIDITY: {
    MIN: 0,
    MAX: 100,
    OPTIMAL_MIN: 50.0,
    OPTIMAL_MAX: 70.0,
    TOLERANCE: 5.0
  },
  LIGHT: {
    MIN: 0,
    MAX: 4095
  }
};

// Incubation settings
const INCUBATION = {
  DURATION_DAYS: 21,
  LOCKDOWN_START_DAY: 19,
  STAGES: {
    INCUBATION: 'incubation',
    LOCKDOWN: 'lockdown',
    HATCHING: 'hatching'
  },
  DEFAULT_SETTINGS: {
    INCUBATION: {
      TEMPERATURE: 37.5,
      HUMIDITY: 60.0,
      TURNING: true
    },
    LOCKDOWN: {
      TEMPERATURE: 37.2,
      HUMIDITY: 70.0,
      TURNING: false
    }
  }
};

// MQTT topics
const MQTT_TOPICS = {
  SENSOR_DATA: 'incubator/user/{userId}/sensor/data',
  DEVICE_STATUS: 'incubator/user/{userId}/device/status',
  COMMANDS: 'incubator/user/{userId}/device/commands',
  ALERTS: 'incubator/user/{userId}/alerts'
};

// API limits
const API_LIMITS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 1000
  },
  EXPORT: {
    MAX_RECORDS: 10000
  },
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  }
};

// Data retention
const DATA_RETENTION = {
  SENSOR_DATA_DAYS: 30,
  RESOLVED_ALERTS_DAYS: 90,
  LOGS_DAYS: 7
};

// Device settings limits
const DEVICE_SETTINGS = {
  TARGET_TEMPERATURE: {
    MIN: 30,
    MAX: 45
  },
  TARGET_HUMIDITY: {
    MIN: 30,
    MAX: 80
  },
  TURNING_INTERVAL: {
    MIN: 300000, // 5 minutes
    MAX: 14400000 // 4 hours
  }
};

// Email templates
const EMAIL_TEMPLATES = {
  ALERT: 'alert',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  DEVICE_REGISTERED: 'device_registered'
};

// File upload limits
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'text/csv', 'application/json']
};

// Cache settings
const CACHE = {
  DEFAULT_TTL: 300, // 5 minutes
  SENSOR_DATA_TTL: 60, // 1 minute
  USER_PROFILE_TTL: 600, // 10 minutes
  DEVICE_STATUS_TTL: 30 // 30 seconds
};

// Database collection names
const COLLECTIONS = {
  USERS: 'users',
  DEVICES: 'devices',
  SENSOR_DATA: 'sensordata',
  ALERTS: 'alerts',
  LOGS: 'logs'
};

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  MQTT_ERROR: 'MQTT_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR'
};

// Success messages
const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'Logged in successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  DEVICE_REGISTERED: 'Device registered successfully',
  DEVICE_UPDATED: 'Device updated successfully',
  DEVICE_DELETED: 'Device removed successfully',
  COMMAND_SENT: 'Command sent to device successfully',
  ALERT_RESOLVED: 'Alert marked as resolved',
  DATA_EXPORTED: 'Data exported successfully'
};

// Device commands
const DEVICE_COMMANDS = {
  SET_TEMPERATURE: 'target_temperature',
  SET_HUMIDITY: 'target_humidity',
  TURN_EGGS: 'turn_eggs',
  ENABLE_AUTO: 'auto_mode',
  ENABLE_TURNING: 'turning_enabled',
  HEATER_CONTROL: 'heater',
  HUMIDIFIER_CONTROL: 'humidifier',
  EMERGENCY_STOP: 'emergency_stop'
};

// Quick actions
const QUICK_ACTIONS = {
  TURN_EGGS: 'turn_eggs',
  ENABLE_AUTO: 'enable_auto',
  DISABLE_AUTO: 'disable_auto',
  EMERGENCY_STOP: 'emergency_stop'
};

// Time constants
const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000
};

// Status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

module.exports = {
  USER_ROLES,
  DEVICE_STATUS,
  ALERT_TYPES,
  ALERT_SEVERITY,
  SENSOR_LIMITS,
  INCUBATION,
  MQTT_TOPICS,
  API_LIMITS,
  DATA_RETENTION,
  DEVICE_SETTINGS,
  EMAIL_TEMPLATES,
  UPLOAD_LIMITS,
  CACHE,
  COLLECTIONS,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  DEVICE_COMMANDS,
  QUICK_ACTIONS,
  TIME,
  HTTP_STATUS
};