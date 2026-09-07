const WaterLog = require('../models/WaterLog');
const { getCurrentDateString } = require('../utils/timeUtils');
const { formatProgressReport, formatWaterAddedResponse } = require('../utils/progressUtils');
const logger = require('../utils/logger');

class WaterService {
  /**
   * Get or create today's water log for a user
   * @param {object} user - User document
   * @returns {Promise<object>} WaterLog document
   */
  async getOrCreateTodayLog(user) {
    const todayDate = getCurrentDateString(user.timezone);

    let log = await WaterLog.findOne({
      userId: user._id,
      date: todayDate
    });

    if (!log) {
      log = await WaterLog.create({
        userId: user._id,
        phoneNumber: user.phoneNumber,
        date: todayDate,
        goal: user.dailyGoal,
        totalConsumed: 0,
        entries: [],
        goalCompleted: false
      });
      logger.info(`Created new daily WaterLog for user ${user.phoneNumber} on date ${todayDate}`);
    }

    return log;
  }

  /**
   * Record water intake (from proactive drinking or reminder reply)
   * Automatically updates next reminder timer so user is not bothered right after drinking!
   * @param {object} user - User document
   * @param {number} amount - Amount in ml (positive integer)
   * @param {string} [containerLabel=''] - e.g. "1 glass", "2 bottles"
   * @returns {Promise<{ message: string, log: object }>}
   */
  async addWaterIntake(user, amount, containerLabel = '') {
    const log = await this.getOrCreateTodayLog(user);

    const wasCompletedBefore = log.goalCompleted;
    log.totalConsumed += amount;
    log.entries.push({
      amount: amount,
      timestamp: new Date()
    });

    let justCompletedGoal = false;
    if (!wasCompletedBefore && log.totalConsumed >= log.goal) {
      log.goalCompleted = true;
      log.goalCompletedAt = new Date();
      justCompletedGoal = true;
    }

    await log.save();

    // Smart Proactive Drinking Optimization:
    // When user drinks water, reset reminder timer to start from NOW + interval
    // and mark status as REPLIED so any pending nudge is cancelled!
    const now = new Date();
    user.lastDrinkTime = now;
    user.lastReminderSentAt = now;
    user.lastReminderStatus = 'REPLIED';
    user.nudgeSentForCurrentReminder = false;
    await user.save();

    logger.info(`User ${user.phoneNumber} logged ${amount}ml water (${containerLabel || 'direct'}). Next reminder timer reset.`);

    const replyText = formatWaterAddedResponse(amount, log.goal, log.totalConsumed, justCompletedGoal, containerLabel);
    return { message: replyText, log, justCompletedGoal };
  }

  /**
   * Undo the last logged drink entry
   * @param {object} user - User document
   * @returns {Promise<string>}
   */
  async undoLastIntake(user) {
    const log = await this.getOrCreateTodayLog(user);
    if (!log.entries || log.entries.length === 0) {
      return `ℹ️ Aaj koi drink log nahi hua hai jise undo kiya ja sake.`;
    }

    const lastEntry = log.entries.pop();
    log.totalConsumed = Math.max(0, log.totalConsumed - lastEntry.amount);
    if (log.totalConsumed < log.goal) {
      log.goalCompleted = false;
      log.goalCompletedAt = null;
    }
    await log.save();

    const percentage = log.goal > 0 ? Math.round((log.totalConsumed / log.goal) * 100) : 0;
    const remaining = Math.max(0, log.goal - log.totalConsumed);

    return (
      `↩️ *Koi baat nahi! Last entry (${lastEntry.amount} ml) hata di gayi hai.*\n\n` +
      `Updated Total: *${log.totalConsumed} / ${log.goal} ml* (${percentage}%)\n` +
      `Remaining: *${remaining} ml*`
    );
  }

  /**
   * Get formatted progress for today
   * @param {object} user - User document
   * @returns {Promise<string>}
   */
  async getProgressReport(user) {
    const log = await this.getOrCreateTodayLog(user);
    return formatProgressReport(log.goal, log.totalConsumed);
  }

  /**
   * Reset today's intake
   * @param {object} user - User document
   * @returns {Promise<string>}
   */
  async resetTodayIntake(user) {
    const log = await this.getOrCreateTodayLog(user);
    log.totalConsumed = 0;
    log.entries = [];
    log.goalCompleted = false;
    log.goalCompletedAt = null;
    await log.save();

    logger.info(`User ${user.phoneNumber} reset today's water intake`);
    return `🔄 *Aaj ka water intake 0 ml reset ho gaya hai!*\n\nDaily target: ${log.goal} ml.\nChalo naye sire se shuruat karte hain! 💧`;
  }
}

module.exports = new WaterService();
