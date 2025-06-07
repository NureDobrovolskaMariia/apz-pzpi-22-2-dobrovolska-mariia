// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path'); // Добавляем модуль path

// Services
const mqttService = require('./services/mqttService');

// Middleware
const { globalErrorHandler, notFound } = require('./middleware/errorHandler');
const { requestLogger, apiAnalytics, securityLogger, rateLimitLogger } = require('./middleware/logger');

// Routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const dataRoutes = require('./routes/data');
const alertRoutes = require('./routes/alerts');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(), // Беремо стандартні директиви
      "script-src": ["'self'", "https://cdn.jsdelivr.net"], // Дозволяємо 'self' та cdn.jsdelivr.net
      // Якщо Chart.js використовує inline стилі або eval, можливо, знадобиться 'unsafe-inline' або 'unsafe-eval',
      // але краще цього уникати. Для Chart.js v3 зазвичай достатньо джерела скрипту.
      // "style-src": ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"], // Приклад, якщо потрібні стилі з CDN
    },
  })
);
app.use(cors());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
  app.use(apiAnalytics);
}
app.use(securityLogger);
app.use(rateLimitLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 100000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'web' directory
app.use(express.static(path.join(__dirname, 'web'))); //

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Database connection events
mongoose.connection.on('disconnected', () => {
  console.log('📴 MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});

// Routes
app.get('/', (req, res) => {
  // Instead of JSON, now serve the login page by default
  res.sendFile(path.join(__dirname, 'web', 'html', 'login.html')); //
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mqtt: mqttService.isConnected ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.json(health);
});

// API Routes
app.use('/api/auth', authRoutes); //
app.use('/api/devices', deviceRoutes); //
app.use('/api/data', dataRoutes); //
app.use('/api/alerts', alertRoutes); //
app.use('/api/users', userRoutes); //

// MQTT test endpoint
app.post('/api/test/command', (req, res) => { //
  try {
    const { userId, deviceId, command } = req.body;
    
    if (!userId || !deviceId || !command) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    mqttService.sendCommand(userId, deviceId, command);
    res.json({ message: 'Command sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler for undefined routes
app.use(notFound); //

// Global error handling middleware
app.use(globalErrorHandler); //

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown); //
process.on('SIGINT', gracefulShutdown); //

function gracefulShutdown(signal) { //
  console.log(`\n📴 Received ${signal}. Graceful shutdown...`);
  
  // Close MQTT connection
  mqttService.disconnect();
  
  // Close MongoDB connection
  mongoose.connection.close(() => {
    console.log('📴 MongoDB connection closed');
    process.exit(0);
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize MQTT connection
  mqttService.connect();
});

module.exports = app;