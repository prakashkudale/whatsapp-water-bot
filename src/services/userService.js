const User = require('../models/User');
const { parseTimeString } = require('../utils/timeUtils');
const waterService = require('./waterService');
const logger = require('../utils/logger');

class UserService {
  /**
   * Find or create user by phone number
   * @param {string} phoneNumber
   * @param {string} [name='']
   * @returns {Promise<object>} User document
   */
  async getOrCreateUser(phoneNumber, name = '') {
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      user = await User.create({
        phoneNumber,
        name: name || '',
        dailyGoal: 2500,
        wakeUpTime: '8:00 AM',
        wakeUpHour: 8,
        wakeUpMinute: 0,
        sleepTime: '11:00 PM',
        sleepHour: 23,
        sleepMinute: 0,
        reminderInterval: 2,
        timezone: process.env.TIMEZONE || 'Asia/Kolkata',
        setupCompleted: false,
        setupStep: 'NONE'
      });
      logger.info(`Registered new user with phone number: ${phoneNumber}`);
    } else if (name && !user.name) {
      user.name = name;
      await user.save();
    }

    return user;
  }

  /**
   * Main message router handling commands, setup conversation steps, and water logging
   * @param {string} phoneNumber
   * @param {string} text
   * @param {string} [userName='']
   * @returns {Promise<string>} Bot reply message
   */
  async processIncomingMessage(phoneNumber, text, userName = '') {
    const user = await this.getOrCreateUser(phoneNumber, userName);
    const input = text.trim();
    const lowerInput = input.toLowerCase();

    // 1. Reset confirmation handling
    if (user.setupStep === 'AWAITING_RESET_CONFIRM') {
      if (lowerInput === 'yes' || lowerInput === 'y') {
        user.setupStep = 'NONE';
        await user.save();
        return await waterService.resetTodayIntake(user);
      } else {
        user.setupStep = 'NONE';
        await user.save();
        return '❌ Reset cancelled. Your water intake remains unchanged.';
      }
    }

    // 2. Global command: "setup" (can restart setup anytime)
    if (lowerInput === 'setup') {
      user.setupStep = 'AWAITING_GOAL';
      await user.save();
      return (
        `💧 *What is your daily water goal?*\n\n` +
        `Example: 2500 ml`
      );
    }

    // 3. Multi-step setup state machine
    if (user.setupStep && user.setupStep !== 'NONE') {
      return await this._handleSetupStep(user, input);
    }

    // 4. Command: "help"
    if (lowerInput === 'help' || lowerInput === 'commands') {
      return this._getHelpMessage();
    }

    // 5. Command: "progress"
    if (lowerInput === 'progress') {
      return await waterService.getProgressReport(user);
    }

    // 6. Command: "goal"
    if (lowerInput === 'goal') {
      return `🎯 Your current daily water goal is *${user.dailyGoal} ml*.\n\nSend *setup* if you want to change your goal or schedule.`;
    }

    // 7. Command: "status"
    if (lowerInput === 'status') {
      return await this._getStatusReport(user);
    }

    // 8. Command: "stop" / "pause"
    if (lowerInput === 'stop' || lowerInput === 'pause') {
      user.remindersEnabled = false;
      await user.save();
      return `⏸️ Water reminders have been paused.\n\nSend *start* anytime to enable them again.`;
    }

    // 9. Command: "start" / "resume"
    if (lowerInput === 'start' || lowerInput === 'resume') {
      user.remindersEnabled = true;
      await user.save();
      return `▶️ Water reminders are now active! Stay hydrated 💧`;
    }

    // 10. Command: "reset"
    if (lowerInput === 'reset') {
      user.setupStep = 'AWAITING_RESET_CONFIRM';
      await user.save();
      return (
        `⚠️ Are you sure you want to reset today's water intake?\n\n` +
        `Reply *YES* to confirm, or anything else to cancel.`
      );
    }

    // 11. Numeric input for logging water intake (e.g. 250, 500, 750)
    const numericMatch = input.match(/^(\d+)\s*(?:ml)?$/i);
    if (numericMatch) {
      const amount = parseInt(numericMatch[1], 10);
      if (amount > 0 && amount <= 5000) {
        const result = await waterService.addWaterIntake(user, amount);
        return result.message;
      } else {
        return `⚠️ Please enter a reasonable water amount between 1 and 5000 ml.`;
      }
    }

    // 12. Fallback for unconfigured or unrecognized message
    if (!user.setupCompleted) {
      return (
        `👋 Welcome to your *Personal WhatsApp Water Reminder Bot*!\n\n` +
        `To get started and set your daily water goal, send:\n👉 *setup*`
      );
    }

    return (
      `💧 I didn't recognize that command.\n\n` +
      `• Send an amount like *250* or *500* to log water intake.\n` +
      `• Send *progress* to see your daily progress.\n` +
      `• Send *help* for all available commands.`
    );
  }

  /**
   * Handle setup step transitions
   * @private
   */
  async _handleSetupStep(user, input) {
    switch (user.setupStep) {
      // Step 1: Daily Goal
      case 'AWAITING_GOAL': {
        const goalMatch = input.match(/^(\d+)\s*(?:ml)?$/i);
        const goal = goalMatch ? parseInt(goalMatch[1], 10) : null;

        if (!goal || goal < 500 || goal > 15000) {
          return `⚠️ Please enter a valid daily goal between 500 ml and 15000 ml.\n\nExample: 2500`;
        }

        user.dailyGoal = goal;
        user.setupStep = 'AWAITING_WAKEUP';
        await user.save();

        return (
          `What time do you usually wake up?\n\n` +
          `Example: 8:00 AM`
        );
      }

      // Step 2: Wake-up Time
      case 'AWAITING_WAKEUP': {
        const parsedTime = parseTimeString(input);
        if (!parsedTime.valid) {
          return `⚠️ ${parsedTime.error}\n\nExample: 8:00 AM`;
        }

        user.wakeUpTime = parsedTime.formatted;
        user.wakeUpHour = parsedTime.hour24;
        user.wakeUpMinute = parsedTime.minute;
        user.setupStep = 'AWAITING_SLEEP';
        await user.save();

        return (
          `What time do you usually sleep?\n\n` +
          `Example: 11:00 PM`
        );
      }

      // Step 3: Sleep Time
      case 'AWAITING_SLEEP': {
        const parsedTime = parseTimeString(input);
        if (!parsedTime.valid) {
          return `⚠️ ${parsedTime.error}\n\nExample: 11:00 PM`;
        }

        user.sleepTime = parsedTime.formatted;
        user.sleepHour = parsedTime.hour24;
        user.sleepMinute = parsedTime.minute;
        user.setupStep = 'AWAITING_INTERVAL';
        await user.save();

        return (
          `How often should I remind you?\n\n` +
          `Example:\n` +
          `1 = Every 1 hour\n` +
          `2 = Every 2 hours\n` +
          `3 = Every 3 hours`
        );
      }

      // Step 4: Reminder Interval
      case 'AWAITING_INTERVAL': {
        const intervalMatch = input.match(/^(\d+)\s*(?:hours?|hrs?)?$/i);
        const interval = intervalMatch ? parseInt(intervalMatch[1], 10) : null;

        if (!interval || interval < 1 || interval > 12) {
          return (
            `⚠️ Please enter an interval between 1 and 12 hours.\n\n` +
            `Example:\n` +
            `1 = Every 1 hour\n` +
            `2 = Every 2 hours\n` +
            `3 = Every 3 hours`
          );
        }

        user.reminderInterval = interval;
        user.setupCompleted = true;
        user.setupStep = 'NONE';
        user.remindersEnabled = true;
        await user.save();

        return (
          `✅ *You're all set!*\n\n` +
          `Daily goal: ${user.dailyGoal} ml\n` +
          `Wake up: ${user.wakeUpTime}\n` +
          `Sleep: ${user.sleepTime}\n` +
          `Reminder: Every ${user.reminderInterval} hour${user.reminderInterval > 1 ? 's' : ''}\n\n` +
          `I'll remind you to drink water 💧`
        );
      }

      default: {
        user.setupStep = 'NONE';
        await user.save();
        return `Setup reset. Send *setup* to start again.`;
      }
    }
  }

  /**
   * Status report
   * @private
   */
  async _getStatusReport(user) {
    const progressText = await waterService.getProgressReport(user);
    const statusIcon = user.remindersEnabled ? '🟢 Active' : '🔴 Paused';

    return (
      `📊 *Bot Status & Configuration*\n\n` +
      `• Reminders: ${statusIcon}\n` +
      `• Daily Goal: ${user.dailyGoal} ml\n` +
      `• Active Window: ${user.wakeUpTime} to ${user.sleepTime}\n` +
      `• Frequency: Every ${user.reminderInterval} hour${user.reminderInterval > 1 ? 's' : ''}\n` +
      `• Timezone: ${user.timezone}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      progressText
    );
  }

  /**
   * Help message
   * @private
   */
  _getHelpMessage() {
    return (
      `💧 *WhatsApp Water Reminder Bot Commands*\n\n` +
      `• *<number>* (e.g. *250*, *500*) - Log water consumed in ml\n` +
      `• *progress* - View today's intake & progress bar\n` +
      `• *setup* - Start/reconfigure your water goal & schedule\n` +
      `• *status* - View your configuration & status\n` +
      `• *goal* - View your current daily goal\n` +
      `• *stop* - Pause water reminders\n` +
      `• *start* - Resume water reminders\n` +
      `• *reset* - Reset today's water intake count\n` +
      `• *help* - Show this command guide`
    );
  }
}

module.exports = new UserService();
