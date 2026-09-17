const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/weekly', statsController.getWeeklyStats);
router.get('/monthly', statsController.getMonthlyStats);
router.get('/streak', statsController.getStreakInfo);
router.get('/nutrition-tip', statsController.getNutritionTip);

module.exports = router;
