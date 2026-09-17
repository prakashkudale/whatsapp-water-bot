const express = require('express');
const router = express.Router();
const waterController = require('../controllers/waterController');
const { protect } = require('../middleware/authMiddleware');

// All water routes require authentication
router.use(protect);

router.post('/log', waterController.logWater);
router.get('/progress', waterController.getProgress);
router.get('/history', waterController.getHistory);
router.delete('/undo', waterController.undoLast);
router.post('/reset', waterController.resetToday);

module.exports = router;
