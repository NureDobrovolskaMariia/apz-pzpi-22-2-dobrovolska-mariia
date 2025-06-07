const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');
const { validateQueryParams, validateManualAlert } = require('../middleware/validation'); // Добавляем validateManualAlert

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Alert management routes
router.route('/')
  .get(validateQueryParams, alertController.getUserAlerts)
  .post(validateManualAlert, alertController.createAlert); // Используем новую валидацию

router.get('/critical', alertController.getCriticalAlerts);
router.get('/statistics', validateQueryParams, alertController.getAlertStatistics);

router.route('/:alertId')
  .get(alertController.getAlert)
  .patch(alertController.resolveAlert);

// Bulk operations
router.patch('/resolve/multiple', alertController.resolveMultipleAlerts);
router.delete('/cleanup', alertController.deleteResolvedAlerts);

module.exports = router;