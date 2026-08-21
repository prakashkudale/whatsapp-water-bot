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
   * Main message router handling commands, setup conversation steps, button actions, and water logging
   * @param {string} phoneNumber
   * @param {string} text
   * @param {string} [userName='']
   * @returns {Promise<object|string>} Bot reply message structure
   */
  async processIncomingMessage(phoneNumber, text, userName = '') {
    const user = await this.getOrCreateUser(phoneNumber, userName);
    const input = String(text || '').trim();
    const lowerInput = input.toLowerCase();

    // 0. Interactive Button ID Translations
    let normalized = lowerInput;
    if (lowerInput === 'quick_250' || lowerInput === '+250 ml 💧' || lowerInput === '+250 ml' || lowerInput === '+250ml') {
      normalized = '250';
    } else if (lowerInput === 'quick_500' || lowerInput === '+500 ml 🥤' || lowerInput === '+500 ml' || lowerInput === '+500ml') {
      normalized = '500';
    } else if (lowerInput === 'btn_progress' || lowerInput === 'progress 📊') {
      normalized = 'progress';
    } else if (lowerInput === 'btn_status' || lowerInput === 'status 📊') {
      normalized = 'status';
    } else if (lowerInput === 'btn_help' || lowerInput === 'help ❓') {
      normalized = 'help';
    } else if (lowerInput === 'interval_1' || lowerInput === 'every 1 hour' || lowerInput === '1 hour') {
      normalized = '1';
    } else if (lowerInput === 'interval_2' || lowerInput === 'every 2 hours' || lowerInput === '2 hours') {
      normalized = '2';
    } else if (lowerInput === 'interval_3' || lowerInput === 'every 3 hours' || lowerInput === '3 hours') {
      normalized = '3';
    } else if (lowerInput === 'reset_confirm' || lowerInput === 'yes, reset 🔄' || lowerInput === 'yes, reset') {
      normalized = 'yes';
    } else if (lowerInput === 'reset_cancel' || lowerInput === 'cancel ❌' || lowerInput === 'cancel') {
      normalized = 'no';
    }

    // 1. Reset confirmation handling
    if (user.setupStep === 'AWAITING_RESET_CONFIRM') {
      if (normalized === 'yes' || normalized === 'y') {
        user.setupStep = 'NONE';
        await user.save();
        const resetMsg = await waterService.resetTodayIntake(user);
        return {
          text: resetMsg,
          buttons: [
            { id: 'quick_250', text: '+250 ml 💧' },
            { id: 'quick_500', text: '+500 ml 🥤' },
            { id: 'btn_progress', text: 'Progress 📊' }
          ]
        };
      } else {
        user.setupStep = 'NONE';
        await user.save();
        return {
          text: '❌ Reset cancelled. Your water intake remains unchanged.',
          buttons: [
            { id: 'btn_progress', text: 'Progress 📊' },
            { id: 'btn_status', text: 'Status ⚙️' }
          ]
        };
      }
    }

    // 2. Global command: "setup" (can restart setup anytime)
    if (normalized === 'setup') {
      user.setupStep = 'AWAITING_GOAL';
      await user.save();
      return (
        `💧 *What is your daily water goal?*\n\n` +
        `Example: 2500 ml (or 2000, 3000)`
      );
    }

    // 3. Multi-step setup state machine
    if (user.setupStep && user.setupStep !== 'NONE') {
      return await this._handleSetupStep(user, normalized);
    }

    // 4. Command: "help"
    if (normalized === 'help' || normalized === 'commands') {
      return {
        text: this._getHelpMessage(),
        buttons: [
          { id: 'btn_progress', text: 'Progress 📊' },
          { id: 'btn_status', text: 'Status ⚙️' }
        ]
      };
    }

    // 5. Command: "progress"
    if (normalized === 'progress') {
      const progressText = await waterService.getProgressReport(user);
      return {
        text: progressText,
        buttons: [
          { id: 'quick_250', text: '+250 ml 💧' },
          { id: 'quick_500', text: '+500 ml 🥤' },
          { id: 'btn_status', text: 'Status ⚙️' }
        ],
        footer: 'Tap to log water intake'
      };
    }

    // 6. Command: "goal"
    if (normalized === 'goal') {
      return {
        text: `🎯 Your current daily water goal is *${user.dailyGoal} ml*.\n\nSend *setup* if you want to change your goal or schedule.`,
        buttons: [
          { id: 'btn_progress', text: 'Progress 📊' },
          { id: 'btn_status', text: 'Status ⚙️' }
        ]
      };
    }

    // 7. Command: "status"
    if (normalized === 'status') {
      return await this._getStatusReport(user);
    }

    // 8. Command: "stop" / "pause"
    if (normalized === 'stop' || normalized === 'pause') {
      user.remindersEnabled = false;
      await user.save();
      return {
        text: `⏸️ Water reminders have been paused.\n\nSend *start* anytime to enable them again.`,
        buttons: [
          { id: 'start', text: 'Start Reminders ▶️' },
          { id: 'btn_progress', text: 'Progress 📊' }
        ]
      };
    }

    // 9. Command: "start" / "resume"
    if (normalized === 'start' || normalized === 'resume') {
      user.remindersEnabled = true;
      await user.save();
      return {
        text: `▶️ Water reminders are now active! Stay hydrated 💧`,
        buttons: [
          { id: 'quick_250', text: '+250 ml 💧' },
          { id: 'quick_500', text: '+500 ml 🥤' },
          { id: 'btn_progress', text: 'Progress 📊' }
        ]
      };
    }

    // 10. Command: "reset"
    if (normalized === 'reset') {
      user.setupStep = 'AWAITING_RESET_CONFIRM';
      await user.save();
      return {
        text: `⚠️ *Are you sure you want to reset today's water intake?*\n\nTap a button below to confirm:`,
        buttons: [
          { id: 'reset_confirm', text: 'Yes, Reset 🔄' },
          { id: 'reset_cancel', text: 'Cancel ❌' }
        ],
        footer: 'Reset Confirmation'
      };
    }

    // 11. Numeric input for logging water intake (e.g. 250, 500, 750)
    const numericMatch = normalized.match(/^(\d+)\s*(?:ml)?$/i);
    if (numericMatch) {
      const amount = parseInt(numericMatch[1], 10);
      if (amount > 0 && amount <= 5000) {
        const result = await waterService.addWaterIntake(user, amount);
        return {
          text: result.message,
          buttons: [
            { id: 'quick_250', text: '+250 ml 💧' },
            { id: 'quick_500', text: '+500 ml 🥤' },
            { id: 'btn_progress', text: 'Progress 📊' }
          ],
          footer: 'Tap to log more water'
        };
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

    return {
      text: (
        `💧 I didn't recognize that command.\n\n` +
        `• Send an amount like *250* or *500* to log water intake.\n` +
        `• Send *progress* to see your daily progress.\n` +
        `• Send *help* for all available commands.`
      ),
      buttons: [
        { id: 'quick_250', text: '+250 ml 💧' },
        { id: 'quick_500', text: '+500 ml 🥤' },
        { id: 'btn_progress', text: 'Progress 📊' }
      ]
    };
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

        return {
          text: (
            `⏱️ *How often should I remind you to drink water?*\n\n` +
            `Tap an option below:`
          ),
          buttons: [
            { id: 'interval_1', text: 'Every 1 Hour ⏰' },
            { id: 'interval_2', text: 'Every 2 Hours ⏰' },
            { id: 'interval_3', text: 'Every 3 Hours ⏰' }
          ],
          footer: 'Choose your reminder frequency'
        };
      }

      // Step 4: Reminder Interval
      case 'AWAITING_INTERVAL': {
        const intervalMatch = input.match(/^(\d+)\s*(?:hours?|hrs?)?$/i);
        const interval = intervalMatch ? parseInt(intervalMatch[1], 10) : null;

        if (!interval || interval < 1 || interval > 12) {
          return {
            text: `⚠️ Please select an interval between 1 and 12 hours:`,
            buttons: [
              { id: 'interval_1', text: 'Every 1 Hour ⏰' },
              { id: 'interval_2', text: 'Every 2 Hours ⏰' },
              { id: 'interval_3', text: 'Every 3 Hours ⏰' }
            ]
          };
        }

        user.reminderInterval = interval;
        user.setupCompleted = true;
        user.setupStep = 'NONE';
        user.remindersEnabled = true;
        await user.save();

        return {
          text: (
            `✅ *You're all set!*\n\n` +
            `🎯 Daily goal: ${user.dailyGoal} ml\n` +
            `🌅 Wake up: ${user.wakeUpTime}\n` +
            `🌙 Sleep: ${user.sleepTime}\n` +
            `⏰ Reminder: Every ${user.reminderInterval} hour${user.reminderInterval > 1 ? 's' : ''}\n\n` +
            `I'll remind you to drink water throughout the day 💧`
          ),
          buttons: [
            { id: 'quick_250', text: '+250 ml 💧' },
            { id: 'quick_500', text: '+500 ml 🥤' },
            { id: 'btn_progress', text: 'Progress 📊' }
          ],
          footer: 'Tap to log your first drink'
        };
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

    return {
      text: (
        `📊 *Bot Status & Configuration*\n\n` +
        `• Reminders: ${statusIcon}\n` +
        `• Daily Goal: ${user.dailyGoal} ml\n` +
        `• Active Window: ${user.wakeUpTime} to ${user.sleepTime}\n` +
        `• Frequency: Every ${user.reminderInterval} hour${user.reminderInterval > 1 ? 's' : ''}\n` +
        `• Timezone: ${user.timezone}\n\n` +
        `━━━━━━━━━━━━━━━\n` +
        progressText
      ),
      buttons: [
        { id: 'quick_250', text: '+250 ml 💧' },
        { id: 'quick_500', text: '+500 ml 🥤' },
        { id: 'btn_progress', text: 'Progress 📊' }
      ]
    };
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
