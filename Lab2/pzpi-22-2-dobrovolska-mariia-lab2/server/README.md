# 🐣 Chicken Incubator Management Server

A simple IoT server for monitoring chicken incubators with MQTT communication and email alerts.

## Features

- **MQTT Integration**: Receives data from ESP32 devices
- **MongoDB Storage**: Stores sensor data and device information
- **Email Alerts**: Sends notifications when conditions are out of range
- **Real-time Monitoring**: Temperature, humidity, and light level tracking
- **User Management**: Multi-user support with device assignment
- **Alert System**: Automatic alerts for temperature and humidity deviations

## Quick Start

### 1. Install Dependencies
```bash
cd D:\Projects\apz-mariya\server
npm install
```

### 2. Configure Environment
Update the `.env` file with your email settings:
```env
# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Chicken Incubator System <your-email@gmail.com>
```

### 3. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 4. Test the Server
Visit: `http://localhost:3000`

You should see:
```json
{
  "message": "🐣 Chicken Incubator Management Server",
  "version": "1.0.0",
  "status": "running",
  "mqtt_status": "connected"
}
```

## IoT Device Setup

### Arduino Code
Use the simplified Arduino code in `iot/incubator_simple.ino`:

**Key Changes Made:**
- Simplified to send only temperature, humidity, and light level
- Removed complex control logic (heater, humidifier, etc.)
- Smaller JSON payload for efficiency
- Reduced memory usage

### Wokwi Circuit
- **ESP32 DevKit**: Main controller
- **DHT22**: Temperature and humidity sensor (Pin 4)
- **Photoresistor**: Light level sensor (Pin 34)
- **LCD 16x2 I2C**: Display (Pins 21, 22)

### MQTT Topics
- **Sensor Data**: `incubator/user/{userId}/sensor/data`
- **Device Status**: `incubator/user/{userId}/device/status`

## Database Structure

### Collections

#### Users
```javascript
{
  name: String,
  email: String,
  password: String (hashed),
  role: 'user' | 'admin',
  emailNotifications: Boolean,
  alertSettings: {
    temperature: { min: Number, max: Number },
    humidity: { min: Number, max: Number }
  }
}
```

#### Devices
```javascript
{
  deviceId: String,
  userId: ObjectId,
  name: String,
  status: 'online' | 'offline' | 'error',
  lastSeen: Date,
  firmware: String,
  ipAddress: String
}
```

#### SensorData
```javascript
{
  deviceId: String,
  userId: ObjectId,
  temperature: Number,
  humidity: Number,
  lightLevel: Number,
  timestamp: Date
}
```

#### Alerts
```javascript
{
  deviceId: String,
  userId: ObjectId,
  type: 'TEMPERATURE' | 'HUMIDITY' | 'DEVICE_OFFLINE',
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  message: String,
  isResolved: Boolean,
  emailSent: Boolean
}
```

## API Endpoints

### Health Check
```
GET /health
```

### Test MQTT Command
```
POST /api/test/command
{
  "userId": "user123",
  "deviceId": "20250530-user123-abc",
  "command": { "test": true }
}
```

## Email Notifications

The server automatically sends email alerts when:
- Temperature goes outside safe range (36-39°C)
- Humidity goes outside safe range (50-70%)
- Device goes offline

### Email Setup (Gmail)
1. Enable 2-factor authentication
2. Generate app password
3. Update `.env` with credentials

## Development

### Project Structure
```
server/
├── models/          # MongoDB schemas
├── services/        # MQTT and email services
├── controllers/     # API controllers (future)
├── routes/          # Express routes (future)
├── middleware/      # Auth middleware (future)
├── iot/            # Arduino code
└── server.js       # Main server file
```

### Future Enhancements
- REST API for web/mobile apps
- User authentication with JWT
- Device management endpoints
- Historical data analysis
- Real-time dashboard
- Push notifications

## Troubleshooting

### MQTT Connection Issues
- Check broker connectivity: `telnet broker.hivemq.com 1883`
- Verify topics match between device and server
- Check network firewall settings

### Email Not Working
- Verify SMTP settings
- Check app password (not regular password)
- Test with: `npm run test-email`

### Database Connection
- Verify MongoDB URI
- Check network connectivity
- Ensure MongoDB Atlas IP whitelist

## Support

For issues and questions, check the logs:
```bash
# View real-time logs
npm run dev

# Check specific components
console.log messages show:
✅ - Success operations
❌ - Error operations  
📡 - MQTT operations
📧 - Email operations
💾 - Database operations
```