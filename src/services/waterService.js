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
   * Record water intake
   * @param {object} user - User document
   * @param {number} amount - Amount in ml (positive integer)
   * @returns {Promise<{ message: string, log: object }>}
   */
  async addWaterIntake(user, amount) {
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
    logger.info(`User ${user.phoneNumber} logged ${amount}ml water. Total today: ${log.totalConsumed}/${log.goal}ml`);

    const replyText = formatWaterAddedResponse(amount, log.goal, log.totalConsumed, justCompletedGoal);
    return { message: replyText, log, justCompletedGoal };
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
    return `🔄 Today's water intake has been reset to 0 ml.\n\nDaily goal: ${log.goal} ml.\nStay hydrated! 💧`;
  }
}

module.exports = new WaterService();
