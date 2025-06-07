const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin,
  validateAlertSettings 
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);

// Protected routes (require authentication)
router.use(authenticate); // All routes below require authentication

router.get('/profile', authController.getProfile);
router.patch('/profile', validateAlertSettings, authController.updateProfile);
router.patch('/change-password', authController.changePassword);
router.delete('/deactivate', authController.deactivateAccount);
router.get('/stats', authController.getUserStats);

module.exports = router;