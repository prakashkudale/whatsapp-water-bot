const WaterLog = require('../models/WaterLog');
const { NUTRITION_TIPS } = require('../utils/hinglishTemplates');
const logger = require('../utils/logger');

/**
 * GET /api/stats/weekly
 */
const getWeeklyStats = async (req, res) => {
  try {
    const user = req.user;
    const logs = await WaterLog.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(7)
      .select('date totalConsumed goal goalCompleted');

    // Build a 7-day array (most recent first, reversed for chart display)
    const stats = logs.map(log => ({
      date: log.date,
      totalConsumed: log.totalConsumed,
      goal: log.goal,
      percentage: log.goal > 0 ? Math.round((log.totalConsumed / log.goal) * 100) : 0,
      goalCompleted: log.goalCompleted
    })).reverse();

    res.json({ success: true, stats });
  } catch (err) {
    logger.error('GetWeeklyStats error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/stats/monthly
 */
const getMonthlyStats = async (req, res) => {
  try {
    const user = req.user;
    const logs = await WaterLog.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(30)
      .select('date totalConsumed goal goalCompleted');

    const stats = logs.map(log => ({
      date: log.date,
      totalConsumed: log.totalConsumed,
      goal: log.goal,
      percentage: log.goal > 0 ? Math.round((log.totalConsumed / log.goal) * 100) : 0,
      goalCompleted: log.goalCompleted
    })).reverse();

    res.json({ success: true, stats });
  } catch (err) {
    logger.error('GetMonthlyStats error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/stats/streak
 */
const getStreakInfo = async (req, res) => {
  try {
    const user = req.user;
    const logs = await WaterLog.find({ userId: user._id, goalCompleted: true })
      .sort({ date: -1 })
      .select('date');

    let currentStreak = 0;
    let checkDate = new Date();

    for (const log of logs) {
      const logDate = new Date(log.date);
      const diffDays = Math.round((checkDate - logDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        currentStreak++;
        checkDate = logDate;
      } else {
        break;
      }
    }

    const totalGoalsHit = await WaterLog.countDocuments({ userId: user._id, goalCompleted: true });

    res.json({ success: true, currentStreak, totalGoalsHit, totalDaysLogged: logs.length });
  } catch (err) {
    logger.error('GetStreakInfo error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/stats/nutrition-tip
 * Returns a random vegetarian nutrition tip
 */
const getNutritionTip = async (req, res) => {
  try {
    // Use day of year as seed for consistency within same day
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const tipIndex = dayOfYear % NUTRITION_TIPS.length;
    const tip = NUTRITION_TIPS[tipIndex];

    // Strip emoji markdown for clean API response, keep raw text
    res.json({ success: true, tip, index: tipIndex });
  } catch (err) {
    logger.error('GetNutritionTip error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getWeeklyStats, getMonthlyStats, getStreakInfo, getNutritionTip };
