const nodemailer = require('nodemailer');
const User = require('../models/User');
const Device = require('../models/Device');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
      console.log('⚠️ Email configuration not found, email notifications disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter error:', error);
      } else {
        console.log('✅ Email transporter ready');
      }
    });
  }

  async sendAlertEmail(alert) {
    if (!this.transporter) {
      console.log('⚠️ Email transporter not available, skipping email');
      return;
    }

    try {
      // Get user and device info
      const user = await User.findById(alert.userId);
      const device = await Device.findOne({ deviceId: alert.deviceId });

      if (!user || !user.emailNotifications) {
        console.log('📧 User email notifications disabled, skipping');
        return;
      }

      const subject = `🚨 Incubator Alert: ${alert.type}`;
      const deviceName = device ? device.name : alert.deviceId;
      
      const htmlContent = this.generateAlertEmailHTML(alert, user, deviceName);
      const textContent = this.generateAlertEmailText(alert, user, deviceName);

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      
      // Update alert to mark email as sent
      alert.emailSent = true;
      alert.emailSentAt = new Date();
      await alert.save();

      console.log(`📧 Alert email sent to ${user.email} for ${alert.type}`);

    } catch (error) {
      console.error('❌ Error sending alert email:', error);
    }
  }

  generateAlertEmailHTML(alert, user, deviceName) {
    const severityColor = {
      'LOW': '#28a745',
      'MEDIUM': '#ffc107', 
      'HIGH': '#fd7e14',
      'CRITICAL': '#dc3545'
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: ${severityColor[alert.severity]}; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .alert-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 Incubator Alert</h1>
                <h2>${alert.type} - ${alert.severity}</h2>
            </div>
            <div class="content">
                <p>Hello ${user.name},</p>
                <p>Your chicken incubator <strong>${deviceName}</strong> requires attention.</p>
                
                <div class="alert-info">
                    <h3>Alert Details:</h3>
                    <p><strong>Type:</strong> ${alert.type}</p>
                    <p><strong>Severity:</strong> ${alert.severity}</p>
                    <p><strong>Message:</strong> ${alert.message}</p>
                    <p><strong>Time:</strong> ${new Date(alert.createdAt).toLocaleString()}</p>
                    ${alert.metadata ? `
                    <p><strong>Current Conditions:</strong></p>
                    <ul>
                        <li>Temperature: ${alert.metadata.temperature}°C</li>
                        <li>Humidity: ${alert.metadata.humidity}%</li>
                        <li>Light Level: ${alert.metadata.lightLevel}</li>
                    </ul>
                    ` : ''}
                </div>
                
                <p>Please check your incubator immediately to ensure the safety of your eggs.</p>
                
                <a href="#" class="button">View Dashboard</a>
            </div>
            <div class="footer">
                <p>Chicken Incubator Management System</p>
                <p>If you no longer wish to receive these notifications, you can disable them in your account settings.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  generateAlertEmailText(alert, user, deviceName) {
    return `
🚨 INCUBATOR ALERT 🚨

Hello ${user.name},

Your chicken incubator "${deviceName}" requires immediate attention.

ALERT DETAILS:
- Type: ${alert.type}
- Severity: ${alert.severity}
- Message: ${alert.message}
- Time: ${new Date(alert.createdAt).toLocaleString()}

${alert.metadata ? `
CURRENT CONDITIONS:
- Temperature: ${alert.metadata.temperature}°C
- Humidity: ${alert.metadata.humidity}%
- Light Level: ${alert.metadata.lightLevel}
` : ''}

Please check your incubator immediately to ensure the safety of your eggs.

---
Chicken Incubator Management System
To disable email notifications, update your account settings.
    `;
  }

  async sendWelcomeEmail(user) {
    if (!this.transporter) return;

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: '🐣 Welcome to Chicken Incubator System',
        html: `
        <h1>Welcome ${user.name}!</h1>
        <p>Thank you for joining our Chicken Incubator Management System.</p>
        <p>You can now monitor and control your incubators remotely, receive alerts, and ensure optimal conditions for your eggs.</p>
        <p>Get started by adding your first device!</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Welcome email sent to ${user.email}`);

    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
    }
  }
}

module.exports = new EmailService();