const User = require('../models/User');
const WaterLog = require('../models/WaterLog');
const waterService = require('./waterService');
const whatsappService = require('./whatsappService');
const {
  getCurrentDateString,
  getPreviousDateString,
  getCurrentTimeInTimezone,
  isTimeWithinWakeWindow
} = require('../utils/timeUtils');
const hinglish = require('../utils/hinglishTemplates');
const logger = require('../utils/logger');

class ReminderService {
  /**
   * Generate energizing Good Morning kickoff message in Funny Hinglish
   * @param {object} user
   * @param {object|null} yesterdayLog
   * @returns {string}
   */
  generateMorningKickoffText(user, yesterdayLog) {
    return hinglish.getMorningKickoffMessage(user, yesterdayLog);
  }

  /**
   * Generate end-of-day final recap before bedtime in Funny Hinglish
   * @param {object} user
   * @param {object} todayLog
   * @returns {string}
   */
  generateBedtimeRecapText(user, todayLog) {
    return hinglish.getBedtimeRecapMessage(user, todayLog);
  }

  /**
   * Determine the appropriate adaptive reminder message in Funny Hinglish
   * @param {number} goal - Daily goal in ml
   * @param {number} totalConsumed - Current consumed in ml
   * @param {object} user - User document
   * @param {string} urgency - Urgency level ('critical', 'behind', 'ontrack', 'ahead', 'chill')
   * @returns {string} Adaptive reminder text
   */
  generateAdaptiveReminderText(goal, totalConsumed, user, urgency = 'ontrack') {
    return hinglish.getAdaptiveReminderMessage(goal, totalConsumed, user, urgency);
  }

  /**
   * Calculate smart dynamic interval based on pacing
   * @param {object} user 
   * @param {object} todayLog 
   * @returns {{intervalMs: number, urgency: string}}
   */
  calculateSmartInterval(user, todayLog) {
    const current = getCurrentTimeInTimezone(user.timezone);
    const wakeTotal = (user.wakeUpHour ?? 8) * 60 + (user.wakeUpMinute ?? 0);
    const sleepTotal = (user.sleepHour ?? 23) * 60 + (user.sleepMinute ?? 0);
    
    let activeMinutes = sleepTotal > wakeTotal ? sleepTotal - wakeTotal : (1440 - wakeTotal) + sleepTotal;
    let minsPassed = current.totalMinutes >= wakeTotal 
      ? current.totalMinutes - wakeTotal 
      : (1440 - wakeTotal) + current.totalMinutes;
    
    // Safety bounds
    if (activeMinutes <= 0) activeMinutes = 1440;
    if (minsPassed < 0) minsPassed = 0;
    
    let minsLeft = activeMinutes - minsPassed;
    if (minsLeft < 0) minsLeft = 0; // Past bedtime

    const waterLeft = Math.max(0, todayLog.goal - todayLog.totalConsumed);
    const hoursLeft = Math.max(0.5, minsLeft / 60); // Don't divide by 0, min half hour
    
    const idealPace = waterLeft / hoursLeft; // ml per hour needed

    // Morning burst: first hour after wake up
    if (minsPassed <= 60 && todayLog.totalConsumed < 500) {
      return { intervalMs: 30 * 60 * 1000, urgency: 'behind' }; 
    }

    // Near bedtime: last 2 hours
    if (minsLeft <= 120 && waterLeft > 500) {
      return { intervalMs: 30 * 60 * 1000, urgency: 'critical' };
    }

    if (idealPace > 400) {
      return { intervalMs: 30 * 60 * 1000, urgency: 'critical' }; // 30 mins
    } else if (idealPace > 250) {
      return { intervalMs: 45 * 60 * 1000, urgency: 'behind' }; // 45 mins
    } else if (idealPace > 150) {
      return { intervalMs: 60 * 60 * 1000, urgency: 'ontrack' }; // 1 hour
    } else if (idealPace > 80) {
      return { intervalMs: 90 * 60 * 1000, urgency: 'ahead' }; // 1.5 hours
    } else {
      return { intervalMs: 150 * 60 * 1000, urgency: 'chill' }; // 2.5 hours
    }
  }

  /**
   * Check all eligible users and execute scheduled reminders, morning kickoffs, and bedtime recaps
   */
  /**
   * Check all eligible users and execute scheduled reminders, morning kickoffs, and bedtime recaps
   */
  async checkAndSendReminders() {
    try {
      // 1. Run Morning Kickoffs (fires at wake-up time)
      await this.checkMorningKickoffs();

      // 2. Run Bedtime Recaps (fires 1h before bedtime if goal not finished)
      await this.checkBedtimeRecaps();

      // 3. Run Gentle Nudge Check for users who saw message > 25 mins ago but forgot to drink
      await this.checkAndSendNudges();

      // 4. Find all active configured users
      const activeUsers = await User.find({
        isSubscribed: true,
        remindersEnabled: true,
        $or: [{ setupCompleted: true }, { setupStep: 'NONE' }]
      });

      if (activeUsers.length === 0) return;

      const now = new Date();

      for (const user of activeUsers) {
        try {
          // Skip the bot's own hosting number so it does not remind itself
          if (user.phoneNumber === '919978241539' || user.phoneNumber === '9978241539') {
            continue;
          }

          if (!isTimeWithinWakeWindow(user, user.timezone)) {
            logger.debug(`Skipping ${user.phoneNumber}: Outside active window (${user.wakeUpTime} to ${user.sleepTime})`);
            continue;
          }

          const todayLog = await waterService.getOrCreateTodayLog(user);
          if (todayLog.goalCompleted || todayLog.totalConsumed >= todayLog.goal) {
            logger.debug(`Skipping ${user.phoneNumber}: Goal completed (${todayLog.totalConsumed}/${todayLog.goal} ml)`);
            continue;
          }

          // Calculate smart interval
          const smartCalc = this.calculateSmartInterval(user, todayLog);
          const intervalMs = smartCalc.intervalMs;
          const urgency = smartCalc.urgency;

          if (user.lastReminderSentAt) {
            const timeSinceLastReminder = now.getTime() - new Date(user.lastReminderSentAt).getTime();
            if (timeSinceLastReminder < intervalMs) {
              const remainingMinutes = Math.round((intervalMs - timeSinceLastReminder) / 60000);
              logger.debug(`Skipping ${user.phoneNumber}: Next reminder in ${remainingMinutes} mins (Urgency: ${urgency})`);
              continue;
            }
          }

          const messageText = this.generateAdaptiveReminderText(todayLog.goal, todayLog.totalConsumed, user, urgency);
          const destination = user.whatsappJid || user.phoneNumber;

          logger.info(`⏰ Sending scheduled reminder to ${user.phoneNumber}`);
          const sendResult = await whatsappService.sendTextMessage(destination, messageText);

          if (sendResult && sendResult.success) {
            user.lastReminderSentAt = now;
            user.lastReminderMessageId = sendResult.messageId || null;
            user.lastReminderStatus = 'SENT';
            user.nudgeSentForCurrentReminder = false;
            user.lastReminderSeenAt = null;
            await user.save();
            logger.info(`✅ Scheduled reminder delivered to ${user.phoneNumber}`);
          } else {
            logger.error(`❌ Failed to send reminder to ${user.phoneNumber}: ${sendResult?.error || 'Send error'}`);
          }

        } catch (userErr) {
          logger.error(`Error processing reminder for user ${user.phoneNumber}:`, userErr.message);
        }
      }
    } catch (err) {
      logger.error('Error during checkAndSendReminders run:', err.message);
    }
  }

  /**
   * Check and send Good Morning Kickoff messages with Hinglish history motivation
   */
  async checkMorningKickoffs() {
    try {
      const activeUsers = await User.find({
        isSubscribed: true,
        remindersEnabled: true,
        $or: [{ setupCompleted: true }, { setupStep: 'NONE' }]
      });

      for (const user of activeUsers) {
        const todayDate = getCurrentDateString(user.timezone);
        if (user.lastMorningKickoffDate === todayDate) continue;

        const current = getCurrentTimeInTimezone(user.timezone);
        const wakeTotal = (user.wakeUpHour ?? 8) * 60 + (user.wakeUpMinute ?? 0);

        // Check if within 45 mins of wake-up time
        if (current.totalMinutes >= wakeTotal && current.totalMinutes <= wakeTotal + 45) {
          const yesterdayDate = getPreviousDateString(user.timezone);
          const yesterdayLog = await WaterLog.findOne({ userId: user._id, date: yesterdayDate });

          const kickoffMsg = this.generateMorningKickoffText(user, yesterdayLog);
          const destination = user.whatsappJid || user.phoneNumber;

          logger.info(`🌅 Sending Good Morning Kickoff to ${user.phoneNumber}`);
          const sendResult = await whatsappService.sendTextMessage(destination, kickoffMsg);

          if (sendResult && sendResult.success) {
            user.lastMorningKickoffDate = todayDate;
            user.lastReminderSentAt = new Date();
            user.lastReminderStatus = 'SENT';
            await user.save();
          }
        }
      }
    } catch (err) {
      logger.error('Error during checkMorningKickoffs:', err.message);
    }
  }

  /**
   * Check and send Bedtime Final Recap messages
   */
  async checkBedtimeRecaps() {
    try {
      const activeUsers = await User.find({
        isSubscribed: true,
        remindersEnabled: true,
        $or: [{ setupCompleted: true }, { setupStep: 'NONE' }]
      });

      for (const user of activeUsers) {
        const todayDate = getCurrentDateString(user.timezone);
        if (user.lastEveningRecapDate === todayDate) continue;

        const current = getCurrentTimeInTimezone(user.timezone);
        const sleepTotal = (user.sleepHour ?? 23) * 60 + (user.sleepMinute ?? 0);

        // Check if within 60 mins before sleep time
        let diffToSleep = sleepTotal - current.totalMinutes;
        if (sleepTotal < (user.wakeUpHour ?? 8) * 60 && current.totalMinutes > sleepTotal) {
          // Sleep past midnight
          diffToSleep = (1440 - current.totalMinutes) + sleepTotal;
        }

        if (diffToSleep >= 0 && diffToSleep <= 60) {
          const todayLog = await waterService.getOrCreateTodayLog(user);
          const recapMsg = this.generateBedtimeRecapText(user, todayLog);
          const destination = user.whatsappJid || user.phoneNumber;

          logger.info(`🌙 Sending Bedtime Recap to ${user.phoneNumber}`);
          const sendResult = await whatsappService.sendTextMessage(destination, recapMsg);

          if (sendResult && sendResult.success) {
            user.lastEveningRecapDate = todayDate;
            await user.save();
          }
        }
      }
    } catch (err) {
      logger.error('Error during checkBedtimeRecaps:', err.message);
    }
  }

  /**
   * Check for users who SAW the reminder > 25 minutes ago but haven't replied/logged water
   */
  async checkAndSendNudges() {
    try {
      const now = new Date();
      const twentyFiveMinsAgo = new Date(now.getTime() - 25 * 60 * 1000);

      const seenUsers = await User.find({
        isSubscribed: true,
        remindersEnabled: true,
        lastReminderStatus: 'SEEN',
        nudgeSentForCurrentReminder: false,
        lastReminderSeenAt: { $lte: twentyFiveMinsAgo }
      });

      for (const user of seenUsers) {
        try {
          if (!isTimeWithinWakeWindow(user, user.timezone)) continue;

          const todayLog = await waterService.getOrCreateTodayLog(user);
          if (todayLog.goalCompleted || todayLog.totalConsumed >= todayLog.goal) continue;

          const nudgeText = hinglish.getGentleNudgeMessage();

          const destination = user.whatsappJid || user.phoneNumber;
          logger.info(`🔔 Sending 1 gentle nudge to ${user.phoneNumber} (seen message > 25m ago without logging)`);
          const sendResult = await whatsappService.sendTextMessage(destination, nudgeText);

          if (sendResult && sendResult.success) {
            user.nudgeSentForCurrentReminder = true;
            await user.save();
          }
        } catch (nudgeErr) {
          logger.error(`Error sending nudge to ${user.phoneNumber}:`, nudgeErr.message);
        }
      }
    } catch (err) {
      logger.error('Error during checkAndSendNudges:', err.message);
    }
  }
}

module.exports = new ReminderService();
