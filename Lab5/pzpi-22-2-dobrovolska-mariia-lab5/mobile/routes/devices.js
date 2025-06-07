const express = require('express');
const deviceController = require('../controllers/deviceController');
const { authenticate } = require('../middleware/auth');
const { 
  validateDevice, 
  validateDeviceSettings,
  validateQueryParams 
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Device management routes
router.route('/')
  .get(deviceController.getUserDevices)
  .post(validateDevice, deviceController.registerDevice);

router.route('/:deviceId')
  .get(deviceController.getDevice)
  .patch(validateDeviceSettings, deviceController.updateDevice)
  .delete(deviceController.deleteDevice);

// Device control and monitoring
router.post('/:deviceId/command', deviceController.sendCommand);
router.post('/:deviceId/actions', deviceController.quickActions);
router.get('/:deviceId/stats', validateQueryParams, deviceController.getDeviceStats);

module.exports = router;