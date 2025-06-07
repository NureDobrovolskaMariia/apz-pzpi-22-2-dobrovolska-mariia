# 🐣 Chicken Incubator API Examples

This document provides examples of how to use the Chicken Incubator Management API.

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require a JWT token. Include it in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Farmer",
  "email": "john@farm.com",
  "password": "password123"
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@farm.com",
  "password": "password123"
}
```

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PATCH /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "emailNotifications": true,
  "alertSettings": {
    "temperature": {
      "min": 36.0,
      "max": 39.0
    },
    "humidity": {
      "min": 50.0,
      "max": 70.0
    }
  }
}
```

---

## 📱 Device Management

### Get All User Devices
```http
GET /api/devices
Authorization: Bearer <token>
```

### Register New Device
```http
POST /api/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceId": "20250530-507f1f77bcf86cd799439011-abc",
  "name": "Barn Incubator #1",
  "location": "Main Barn"
}
```

### Get Single Device
```http
GET /api/devices/20250530-507f1f77bcf86cd799439011-abc
Authorization: Bearer <token>
```

### Update Device Settings
```http
PATCH /api/devices/20250530-507f1f77bcf86cd799439011-abc
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Incubator Name",
  "location": "New Location",
  "settings": {
    "targetTemperature": 37.5,
    "targetHumidity": 60.0,
    "autoMode": true,
    "turningEnabled": true
  }
}
```

### Send Command to Device
```http
POST /api/devices/20250530-507f1f77bcf86cd799439011-abc/command
Authorization: Bearer <token>
Content-Type: application/json

{
  "command": {
    "target_temperature": 38.0,
    "turn_eggs": true
  }
}
```

### Quick Actions
```http
POST /api/devices/20250530-507f1f77bcf86cd799439011-abc/actions
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "turn_eggs"
}
```

Available actions: `turn_eggs`, `enable_auto`, `disable_auto`, `emergency_stop`

---

## 📊 Data Endpoints

### Get Latest Data for All Devices
```http
GET /api/data/latest
Authorization: Bearer <token>
```

### Get Device Sensor Data
```http
GET /api/data/20250530-507f1f77bcf86cd799439011-abc?page=1&limit=100
Authorization: Bearer <token>
```

### Get Device Data with Date Range
```http
GET /api/data/20250530-507f1f77bcf86cd799439011-abc?startDate=2025-05-29T00:00:00Z&endDate=2025-05-30T23:59:59Z
Authorization: Bearer <token>
```

### Get Aggregated Data
```http
GET /api/data/20250530-507f1f77bcf86cd799439011-abc/aggregated?period=hourly&days=7
Authorization: Bearer <token>
```

Periods: `hourly`, `daily`, `weekly`

### Get Data Statistics
```http
GET /api/data/20250530-507f1f77bcf86cd799439011-abc/statistics?days=30
Authorization: Bearer <token>
```

### Export Data (CSV)
```http
GET /api/data/20250530-507f1f77bcf86cd799439011-abc/export?format=csv&startDate=2025-05-01
Authorization: Bearer <token>
```

### Real-time Summary
```http
GET /api/data/summary
Authorization: Bearer <token>
```

---

## 🚨 Alert Management

### Get User Alerts
```http
GET /api/alerts?page=1&limit=50&severity=HIGH&isResolved=false
Authorization: Bearer <token>
```

### Get Critical Alerts
```http
GET /api/alerts/critical
Authorization: Bearer <token>
```

### Resolve Alert
```http
PATCH /api/alerts/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

### Resolve Multiple Alerts
```http
PATCH /api/alerts/resolve/multiple
Authorization: Bearer <token>
Content-Type: application/json

{
  "alertIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ]
}
```

### Get Alert Statistics
```http
GET /api/alerts/statistics?days=30
Authorization: Bearer <token>
```

### Create Manual Alert
```http
POST /api/alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceId": "20250530-507f1f77bcf86cd799439011-abc",
  "type": "TEMPERATURE",
  "severity": "HIGH",
  "message": "Manual alert for testing"
}
```

---

## 👥 User Management (Admin Only)

### Get All Users
```http
GET /api/users?page=1&limit=20&search=john&role=user
Authorization: Bearer <admin-token>
```

### Get Platform Statistics
```http
GET /api/users/platform/stats?days=30
Authorization: Bearer <admin-token>
```

### Get User Details
```http
GET /api/users/507f1f77bcf86cd799439011
Authorization: Bearer <admin-token>
```

### Update User
```http
PATCH /api/users/507f1f77bcf86cd799439011
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "role": "admin",
  "isActive": true
}
```

### Promote User to Admin
```http
PATCH /api/users/507f1f77bcf86cd799439011/promote
Authorization: Bearer <admin-token>
```

---

## 🔍 Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: varies by endpoint)

### Date Filtering
- `startDate`: ISO date string (e.g., "2025-05-29T00:00:00Z")
- `endDate`: ISO date string
- `days`: Number of days from now (alternative to date range)

### Filtering
- `severity`: LOW, MEDIUM, HIGH, CRITICAL
- `type`: TEMPERATURE, HUMIDITY, DEVICE_OFFLINE
- `isResolved`: true/false
- `deviceId`: Filter by specific device

---

## 📋 Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Optional success message",
  "results": 10,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  },
  "data": {
    "key": "response data here"
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "details": ["Validation error details"]
}
```

---

## 🧪 Testing with curl

### Register and Login
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "password123"}'

# Login (save the token from response)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Using JWT Token
```bash
# Get profile (replace TOKEN with actual JWT)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"

# Get devices
curl -X GET http://localhost:3000/api/devices \
  -H "Authorization: Bearer TOKEN"
```

---

## 🐛 Common Issues

### 401 Unauthorized
- Check if JWT token is included in Authorization header
- Verify token format: `Bearer <token>`
- Ensure token hasn't expired

### 403 Forbidden
- User doesn't have required permissions
- Some endpoints require admin role

### 404 Not Found
- Check endpoint URL spelling
- Verify deviceId/userId exists and belongs to user

### 400 Bad Request
- Check request body format (JSON)
- Verify required fields are included
- Check field validation rules

---

## 📱 Device ID Format

Device IDs must follow this format:
```
YYYYMMDD-{userId}-{3RandomChars}
```

Example: `20250530-507f1f77bcf86cd799439011-abc`

- `YYYYMMDD`: Registration date
- `userId`: MongoDB ObjectId of the user (24 characters)
- `3RandomChars`: 3 random characters for uniqueness