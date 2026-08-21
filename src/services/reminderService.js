const User = require('../models/User');
const WaterLog = require('../models/WaterLog');
const waterService = require('./waterService');
const whatsappService = require('./whatsappService');
const { getCurrentTimeInTimezone, isTimeWithinWakeWindow } = require('../utils/timeUtils');
const logger = require('../utils/logger');

class ReminderService {
  /**
   * Determine the appropriate adaptive reminder message based on progress and active day time
   * @param {number} goal - Daily goal in ml
   * @param {number} totalConsumed - Current consumed in ml
   * @param {object} user - User document
   * @returns {string} Adaptive reminder text
   */
  generateAdaptiveReminderText(goal, totalConsumed, user) {
    const remaining = Math.max(0, goal - totalConsumed);

    // If close to completing goal (less than 35% or <= 800ml remaining)
    if (remaining > 0 && remaining <= 800 && totalConsumed > 0) {
      return (
        `💧 *You're almost there!*\n\n` +
        `${totalConsumed} / ${goal} ml\n` +
        `Only ${remaining} ml remaining.`
      );
    }

    // Calculate expected consumption based on time elapsed during active hours
    const current = getCurrentTimeInTimezone(user.timezone);
    const wakeTotal = (user.wakeUpHour ?? 8) * 60 + (user.wakeUpMinute ?? 0);
    const sleepTotal = (user.sleepHour ?? 23) * 60 + (user.sleepMinute ?? 0);

    const activeDayLengthMinutes = Math.max(60, sleepTotal > wakeTotal ? sleepTotal - wakeTotal : (1440 - wakeTotal) + sleepTotal);
    let elapsedActiveMinutes = current.totalMinutes >= wakeTotal 
      ? current.totalMinutes - wakeTotal 
      : (1440 - wakeTotal) + current.totalMinutes;

    const expectedFraction = Math.min(1, Math.max(0, elapsedActiveMinutes / activeDayLengthMinutes));
    const expectedConsumed = Math.round(goal * expectedFraction);

    // If behind expected progress by at least 300 ml
    if (totalConsumed < expectedConsumed - 300) {
      return (
        `💧 *You're a little behind today's goal.*\n\n` +
        `You've had ${totalConsumed} / ${goal} ml.\n\n` +
        `Try drinking some water now.`
      );
    }

    // On track default message
    return (
      `💧 *Time for some water!*\n\n` +
      `You've had ${totalConsumed} / ${goal} ml today.`
    );
  }

  /**
   * Check all eligible users and send due reminders
   */
  async checkAndSendReminders() {
    try {
      // Find all configured users with active reminders
      const activeUsers = await User.find({
        setupCompleted: true,
        remindersEnabled: true
      });

      if (activeUsers.length === 0) {
        return;
      }

      const now = new Date();

      for (const user of activeUsers) {
        try {
          // 1. Check wake-up/sleep active window
          if (!isTimeWithinWakeWindow(user, user.timezone)) {
            logger.debug(`User ${user.phoneNumber} is outside wake window. Skipping reminder.`);
            continue;
          }

          // 2. Check today's water log and goal completion
          const todayLog = await waterService.getOrCreateTodayLog(user);
          if (todayLog.goalCompleted || todayLog.totalConsumed >= todayLog.goal) {
            logger.debug(`User ${user.phoneNumber} already completed daily goal. Skipping reminder.`);
            continue;
          }

          // 3. Check interval timing
          const intervalHours = user.reminderInterval || 2;
          const intervalMs = intervalHours * 60 * 60 * 1000;

          if (user.lastReminderSentAt) {
            const timeSinceLastReminder = now.getTime() - new Date(user.lastReminderSentAt).getTime();
            if (timeSinceLastReminder < intervalMs) {
              // Not yet due
              continue;
            }
          }

          // 4. Generate adaptive reminder message
          const messageText = this.generateAdaptiveReminderText(todayLog.goal, todayLog.totalConsumed, user);

          logger.info(`⏰ Sending scheduled reminder to ${user.phoneNumber}`);
          await whatsappService.sendTextMessage(user.phoneNumber, messageText);

          // 5. Update lastReminderSentAt to prevent duplicates
          user.lastReminderSentAt = now;
          await user.save();

        } catch (userErr) {
          logger.error(`Error processing reminder for user ${user.phoneNumber}:`, userErr.message);
        }
      }
    } catch (err) {
      logger.error('Error during checkAndSendReminders run:', err.message);
    }
  }
}

module.exports = new ReminderService();
