const waterService = require('../services/waterService');
const WaterLog = require('../models/WaterLog');
const { getCurrentDateString } = require('../utils/timeUtils');
const logger = require('../utils/logger');

/**
 * POST /api/water/log
 * Body: { amount: number, containerLabel?: string }
 */
const logWater = async (req, res) => {
  try {
    const { amount, containerLabel } = req.body;
    const ml = parseInt(amount, 10);

    if (!ml || ml < 1 || ml > 5000) {
      return res.status(400).json({ success: false, message: 'Amount must be between 1 and 5000 ml' });
    }

    const result = await waterService.addWaterIntake(req.user, ml, containerLabel || '');

    res.json({
      success: true,
      message: result.message,
      log: {
        totalConsumed: result.log.totalConsumed,
        goal: result.log.goal,
        percentage: Math.round((result.log.totalConsumed / result.log.goal) * 100),
        goalCompleted: result.log.goalCompleted,
        entries: result.log.entries
      },
      justCompletedGoal: result.justCompletedGoal
    });
  } catch (err) {
    logger.error('LogWater error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/water/progress
 * Returns today's water log
 */
const getProgress = async (req, res) => {
  try {
    const log = await waterService.getOrCreateTodayLog(req.user);
    const percentage = log.goal > 0 ? Math.round((log.totalConsumed / log.goal) * 100) : 0;
    const remaining = Math.max(0, log.goal - log.totalConsumed);

    res.json({
      success: true,
      date: log.date,
      totalConsumed: log.totalConsumed,
      goal: log.goal,
      percentage,
      remaining,
      goalCompleted: log.goalCompleted,
      entries: log.entries,
      entriesCount: log.entries.length
    });
  } catch (err) {
    logger.error('GetProgress error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/water/history?days=7
 * Returns water logs for the past N days
 */
const getHistory = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days || '30', 10), 90);
    const user = req.user;

    const logs = await WaterLog.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(days)
      .select('date totalConsumed goal goalCompleted entries');

    res.json({ success: true, logs });
  } catch (err) {
    logger.error('GetHistory error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * DELETE /api/water/undo
 * Undo last entry
 */
const undoLast = async (req, res) => {
  try {
    const message = await waterService.undoLastIntake(req.user);
    const log = await waterService.getOrCreateTodayLog(req.user);
    res.json({
      success: true,
      message,
      log: {
        totalConsumed: log.totalConsumed,
        goal: log.goal,
        percentage: Math.round((log.totalConsumed / log.goal) * 100)
      }
    });
  } catch (err) {
    logger.error('UndoLast error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/water/reset
 * Reset today's intake to 0
 */
const resetToday = async (req, res) => {
  try {
    const message = await waterService.resetTodayIntake(req.user);
    res.json({ success: true, message });
  } catch (err) {
    logger.error('ResetToday error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { logWater, getProgress, getHistory, undoLast, resetToday };
