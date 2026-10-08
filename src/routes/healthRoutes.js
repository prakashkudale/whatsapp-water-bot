const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/healthController');
const { protect } = require('../middleware/authMiddleware');
const { sendPushNotification } = require('../services/pushNotificationService');

router.get('/health', getHealth);

/**
 * GET /test-push
 * Sends a test push notification to the authenticated user's registered device.
 * Usage: Open this URL in browser after logging in via the app.
 * Or: POST /test-push with Bearer token in Authorization header.
 */
router.get('/test-push', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user.expoPushToken) {
      return res.status(400).json({
        success: false,
        message: 'No push token found for this user. Please open the app first so it can register a token.',
        userId: user._id,
        phone: user.phoneNumber
      });
    }
    const result = await sendPushNotification(
      user.expoPushToken,
      '🧪 Test Notification!',
      'Agar yeh aa gaya toh notifications bilkul sahi chal rahe hain! 🎉',
      { type: 'test' }
    );
    return res.json({
      success: result.success,
      message: result.success ? 'Test notification sent! Check your phone.' : 'Failed to send',
      token: user.expoPushToken.slice(-10),
      error: result.error || null
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
