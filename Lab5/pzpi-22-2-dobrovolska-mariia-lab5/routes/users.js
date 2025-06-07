const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateQueryParams, validateAlertSettings } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authenticate, requireAdmin);

// Platform statistics
router.get('/platform/stats', validateQueryParams, userController.getPlatformStats);

// User management routes
router.route('/')
  .get(validateQueryParams, userController.getAllUsers);

router.route('/:userId')
  .get(userController.getUser)
  .patch(validateAlertSettings, userController.updateUser)
  .delete(userController.deleteUser);

// User administration
router.patch('/:userId/promote', userController.promoteToAdmin);
router.get('/:userId/activity', validateQueryParams, userController.getUserActivity);
router.get('/:userId/export', userController.exportUserData);

module.exports = router;