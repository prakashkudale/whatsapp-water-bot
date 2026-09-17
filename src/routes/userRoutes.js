const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected
router.get('/profile', protect, userController.getProfile);
router.put('/setup', protect, userController.updateSetup);
router.put('/push-token', protect, userController.updatePushToken);

module.exports = router;
