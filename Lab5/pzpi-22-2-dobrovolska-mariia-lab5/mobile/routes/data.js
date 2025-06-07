const express = require('express');
const dataController = require('../controllers/dataController');
const { authenticate } = require('../middleware/auth');
const { validateQueryParams } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// General data routes
router.get('/latest', dataController.getLatestData);
router.get('/summary', dataController.getRealTimeSummary);

// Device-specific data routes
router.get('/:deviceId', validateQueryParams, dataController.getDeviceData);
router.get('/:deviceId/aggregated', validateQueryParams, dataController.getAggregatedData);
router.get('/:deviceId/statistics', validateQueryParams, dataController.getDataStatistics);
router.get('/:deviceId/export', validateQueryParams, dataController.exportData);

module.exports = router;