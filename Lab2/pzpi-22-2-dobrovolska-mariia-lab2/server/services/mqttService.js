const mqtt = require('mqtt');
const SensorData = require('../models/SensorData');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
//const emailService = require('./emailService');

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  connect() {
    const options = {
      host: process.env.MQTT_BROKER,
      port: parseInt(process.env.MQTT_PORT),
      protocol: 'mqtt',
      reconnectPeriod: 5000,
      connectTimeout: 30000
    };

    console.log(`🔌 Connecting to MQTT broker: ${process.env.MQTT_BROKER}:${process.env.MQTT_PORT}`);
    
    this.client = mqtt.connect(options);

    this.client.on('connect', () => {
      console.log('✅ MQTT Connected successfully');
      this.isConnected = true;
      
      // Subscribe to all sensor data topics
      this.client.subscribe('incubator/user/+/sensor/data', (err) => {
        if (err) {
          console.error('❌ Failed to subscribe to sensor data topics:', err);
        } else {
          console.log('📡 Subscribed to sensor data topics');
        }
      });

      // Subscribe to device status topics
      this.client.subscribe('incubator/user/+/device/status', (err) => {
        if (err) {
          console.error('❌ Failed to subscribe to device status topics:', err);
        } else {
          console.log('📡 Subscribed to device status topics');
        }
      });

      // Subscribe to alerts
      this.client.subscribe('incubator/user/+/alerts', (err) => {
        if (err) {
          console.error('❌ Failed to subscribe to alert topics:', err);
        } else {
          console.log('📡 Subscribed to alert topics');
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        await this.handleMessage(topic, data);
      } catch (error) {
        console.error('❌ Error processing MQTT message:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT Error:', error);
      this.isConnected = false;
    });

    this.client.on('offline', () => {
      console.log('📴 MQTT Client offline');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      console.log('🔄 MQTT Reconnecting...');
    });
  }

  async handleMessage(topic, data) {
    console.log(`📨 Received message on topic: ${topic}`);
    
    if (topic.includes('/sensor/data')) {
      await this.handleSensorData(data);
    } else if (topic.includes('/device/status')) {
      await this.handleDeviceStatus(data);
    } else if (topic.includes('/alerts')) {
      await this.handleAlert(data);
    }
  }

  async handleSensorData(data) {
    try {
      // Save sensor data to database
      const sensorData = new SensorData({
        deviceId: data.id,
        userId: data.uid,
        temperature: data.temp,
        humidity: data.hum,
        lightLevel: data.light,
        targetTemperature: data.target_temp,
        targetHumidity: data.target_hum,
        deviceStatus: {
          heater: data.heater,
          humidifier: data.humidifier,
          fan: data.fan,
          turner: data.turner
        },
        autoMode: data.auto,
        rssi: data.rssi
      });

      await sensorData.save();
      console.log(`💾 Sensor data saved for device: ${data.id}`);

      // Update device last seen
      await Device.findOneAndUpdate(
        { deviceId: data.id },
        { 
          lastSeen: new Date(),
          status: 'online'
        }
      );

      // Check for alerts
      await this.checkAlerts(data);

    } catch (error) {
      console.error('❌ Error saving sensor data:', error);
    }
  }

  async handleDeviceStatus(data) {
    try {
      await Device.findOneAndUpdate(
        { deviceId: data.id },
        {
          status: data.status,
          firmware: data.fw,
          ipAddress: data.ip,
          lastSeen: new Date()
        },
        { upsert: true }
      );

      console.log(`📱 Device status updated: ${data.id} - ${data.status}`);
    } catch (error) {
      console.error('❌ Error updating device status:', error);
    }
  }

  async handleAlert(data) {
    try {
      const alert = new Alert({
        deviceId: data.id,
        userId: data.uid,
        type: data.alert_type,
        severity: data.severity,
        message: data.message,
        metadata: {
          temperature: data.temp,
          humidity: data.hum
        }
      });

      await alert.save();
      console.log(`🚨 Alert saved: ${data.alert_type} for device ${data.id}`);

      // Send email notification
      //await emailService.sendAlertEmail(alert);

    } catch (error) {
      console.error('❌ Error saving alert:', error);
    }
  }

  async checkAlerts(data) {
    try {
      const device = await Device.findOne({ deviceId: data.id }).populate('userId');
      if (!device || !device.userId) return;

      const user = device.userId;
      const alerts = [];

      // Temperature alerts
      if (data.temp < user.alertSettings.temperature.min || 
          data.temp > user.alertSettings.temperature.max) {
        alerts.push({
          type: 'TEMPERATURE',
          severity: 'HIGH',
          message: `Temperature ${data.temp}°C is outside safe range (${user.alertSettings.temperature.min}-${user.alertSettings.temperature.max}°C)`,
          currentValue: data.temp,
          targetValue: data.target_temp
        });
      }

      // Humidity alerts
      if (data.hum < user.alertSettings.humidity.min || 
          data.hum > user.alertSettings.humidity.max) {
        alerts.push({
          type: 'HUMIDITY',
          severity: 'HIGH',
          message: `Humidity ${data.hum}% is outside safe range (${user.alertSettings.humidity.min}-${user.alertSettings.humidity.max}%)`,
          currentValue: data.hum,
          targetValue: data.target_hum
        });
      }

      // Save and send alerts
      for (const alertData of alerts) {
        // Check if similar alert exists in last 30 minutes
        const existingAlert = await Alert.findOne({
          deviceId: data.id,
          type: alertData.type,
          isResolved: false,
          createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
        });

        if (!existingAlert) {
          const alert = new Alert({
            deviceId: data.id,
            userId: data.uid,
            ...alertData,
            metadata: {
              temperature: data.temp,
              humidity: data.hum,
              lightLevel: data.light
            }
          });

          await alert.save();
          //await emailService.sendAlertEmail(alert);
          console.log(`🚨 Alert created: ${alertData.type} for device ${data.id}`);
        }
      }

    } catch (error) {
      console.error('❌ Error checking alerts:', error);
    }
  }

  sendCommand(userId, deviceId, command) {
    if (!this.isConnected) {
      throw new Error('MQTT client not connected');
    }

    const topic = `incubator/user/${userId}/device/commands`;
    const payload = JSON.stringify({
      device_id: deviceId,
      timestamp: Date.now(),
      ...command
    });

    this.client.publish(topic, payload, (error) => {
      if (error) {
        console.error('❌ Failed to send command:', error);
      } else {
        console.log(`📤 Command sent to device ${deviceId}:`, command);
      }
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      console.log('📴 MQTT Disconnected');
    }
  }
}

module.exports = new MQTTService();