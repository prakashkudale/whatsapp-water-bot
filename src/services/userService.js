const User = require('../models/User');
const { parseTimeString } = require('../utils/timeUtils');
const { parseContainerAmount } = require('../utils/progressUtils');
const waterService = require('./waterService');
const logger = require('../utils/logger');

class UserService {
  /**
   * Find or create user by phone number or ID
   * @param {string} phoneNumber
   * @param {string} [name='']
   * @returns {Promise<object>} User document
   */
  /**
   * Find or create user by phone number or ID
   * @param {string} phoneNumber
   * @param {string} [name='']
   * @param {string} [whatsappJid=null]
   * @returns {Promise<object>} User document
   */
  async getOrCreateUser(phoneNumber, name = '', whatsappJid = null) {
    const cleanPhone = String(phoneNumber || '').replace(/[^\w]/g, '').slice(0, 30);
    if (!cleanPhone) throw new Error('Invalid phone number provided');

    let user = await User.findOne({
      $or: [
        { phoneNumber: cleanPhone },
        ...(whatsappJid ? [{ whatsappJid }] : [])
      ]
    });

    if (!user) {
      user = await User.create({
        phoneNumber: cleanPhone,
        whatsappJid: whatsappJid || null,
        name: String(name || '').slice(0, 100).trim(),
        isSubscribed: false,
        consentGiven: false,
        dailyGoal: 2000,
        wakeUpTime: '9:00 AM',
        wakeUpHour: 9,
        wakeUpMinute: 0,
        sleepTime: '11:00 PM',
        sleepHour: 23,
        sleepMinute: 0,
        reminderInterval: 1,
        timezone: process.env.TIMEZONE || 'Asia/Kolkata',
        setupCompleted: false,
        setupStep: 'NONE',
        remindersEnabled: true
      });
      logger.info(`Registered user entry for: ${cleanPhone}`);
    } else {
      let modified = false;
      if (name && !user.name) {
        user.name = String(name).slice(0, 100).trim();
        modified = true;
      }
      if (whatsappJid && user.whatsappJid !== whatsappJid) {
        user.whatsappJid = whatsappJid;
        modified = true;
      }
      if (modified) await user.save();
    }

    return user;
  }

  /**
   * Main message router handling commands, consent flow, setup steps, inline adjustments, and water logging
   * @param {string} phoneNumber
   * @param {string} text
   * @param {string} [userName='']
   * @param {string} [whatsappJid=null]
   * @returns {Promise<string|null>} Bot reply message, or null to ignore silently
   */
  async processIncomingMessage(phoneNumber, text, userName = '', whatsappJid = null) {
    const cleanPhone = String(phoneNumber || '').replace(/[^\w]/g, '').slice(0, 30);
    if (!cleanPhone) return null;

    const input = String(text || '').slice(0, 500).trim();
    // Normalize commands (support /setup, setup, /stup, /progress, progress, etc.)
    const cleanCmd = input.startsWith('/') ? input.substring(1).trim() : input;
    const lowerInput = cleanCmd.toLowerCase();

    // Find user in database by phone or whatsappJid
    let user = await User.findOne({
      $or: [
        { phoneNumber: cleanPhone },
        ...(whatsappJid ? [{ whatsappJid }] : [])
      ]
    });

    if (user && whatsappJid && user.whatsappJid !== whatsappJid) {
      user.whatsappJid = whatsappJid;
      await user.save();
    }

    // Check if user is invoking setup/subscription (support common typos like /stup, /settup, etc.)
    const isSetupCmd = /^(setup|start|water|stup|settup|set up|start water|subscribe|join|hi|hello|hey)$/i.test(lowerInput);

    // If user is not in database or not subscribed and not currently in active setup conversation:
    if (!user || (!user.isSubscribed && (!user.setupStep || user.setupStep === 'NONE'))) {
      if (!isSetupCmd) {
        // Silently ignore casual messages from non-subscribed contacts
        return null;
      }
    }

    // Ensure user record exists
    if (!user) {
      user = await this.getOrCreateUser(phoneNumber, userName, whatsappJid);
    }

    // 1. Global command: /setup -> Trigger Consent & Introduction
    if (isSetupCmd) {
      user.setupStep = 'AWAITING_CONSENT';
      await user.save();
      const hinglish = require('../utils/hinglishTemplates');
      return hinglish.getWelcomeConsentMessage();
    }

    // 2. Handle Consent Response (YES / NO / Invalid Input)
    if (user.setupStep === 'AWAITING_CONSENT') {
      const isAffirmative = /^(yes|y|agree|sure|ok|start|yep|yeah|haan|ha|sahi hai)$/i.test(lowerInput);
      const isNegative = /^(no|n|cancel|stop|exit|disagree|nope|never|nahi|na)$/i.test(lowerInput);
      const hinglish = require('../utils/hinglishTemplates');

      if (isAffirmative) {
        user.isSubscribed = true;
        user.consentGiven = true;
        user.consentDate = new Date();
        user.remindersEnabled = true;
        user.setupStep = 'AWAITING_GOAL';
        await user.save();

        return hinglish.getStepGoalMessage();
      } else if (isNegative) {
        user.setupStep = 'NONE';
        user.isSubscribed = false;
        user.remindersEnabled = false;
        await user.save();

        return hinglish.getConsentCancelMessage();
      } else {
        return hinglish.getInvalidConsentMessage();
      }
    }

    // 3. Multi-step setup state machine (Steps 1 to 4 with cancellation and validation)
    if (user.setupStep && user.setupStep !== 'NONE') {
      if (lowerInput === 'cancel' || lowerInput === 'exit' || lowerInput === 'stop') {
        user.setupStep = 'NONE';
        await user.save();
        return `❌ *Setup cancel ho gaya.* Naye sire se shuru karne ke liye */setup* bhejo.`;
      }
      return await this._handleSetupStep(user, input);
    }

    // 4. Command: /undo (Undo last drink entry)
    if (lowerInput === 'undo' || lowerInput === 'remove last') {
      return await waterService.undoLastIntake(user);
    }

    const goalChangeMatch = lowerInput.match(/^goal\s+(\d+)\s*(?:ml)?$/i);
    if (goalChangeMatch) {
      const newGoal = parseInt(goalChangeMatch[1], 10);
      if (newGoal >= 500 && newGoal <= 15000) {
        user.dailyGoal = newGoal;
        await user.save();
        const totalGlasses = Math.round(newGoal / 250);
        return `🎯 *Daily target update ho gaya: ${newGoal} ml* (~${totalGlasses} glasses)!`;
      } else {
        return `⚠️ Please 500 se 15000 ml ke beech target choose kijiye (e.g. */goal 2500*).`;
      }
    }

    const wakeChangeMatch = lowerInput.match(/^wake\s+(.+)$/i);
    if (wakeChangeMatch) {
      const parsed = parseTimeString(wakeChangeMatch[1], 'wake');
      if (parsed.valid) {
        user.wakeUpTime = parsed.formatted;
        user.wakeUpHour = parsed.hour24;
        user.wakeUpMinute = parsed.minute;
        await user.save();
        return `🌅 *Uthne ka time update ho gaya: ${parsed.formatted}!*`;
      } else {
        return `⚠️ ${parsed.error}\nExample: */wake 8:00 AM*`;
      }
    }

    const sleepChangeMatch = lowerInput.match(/^sleep\s+(.+)$/i);
    if (sleepChangeMatch) {
      const parsed = parseTimeString(sleepChangeMatch[1], 'sleep');
      if (parsed.valid) {
        user.sleepTime = parsed.formatted;
        user.sleepHour = parsed.hour24;
        user.sleepMinute = parsed.minute;
        await user.save();
        return `🌙 *Sone ka time update ho gaya: ${parsed.formatted}!*`;
      } else {
        return `⚠️ ${parsed.error}\nExample: */sleep 11:00 PM*`;
      }
    }

    // 6. Command: /reset
    if (lowerInput === 'reset') {
      user.setupStep = 'AWAITING_RESET_CONFIRM';
      await user.save();
      return (
        `⚠️ *Kya aap sach me aaj ka intake reset karna chahte hain?*\n\n` +
        `👉 Reply *YES* confirm karne ke liye.\n` +
        `👉 Reply *NO* cancel karne ke liye.`
      );
    }

    // 7. Reset confirmation response
    if (user.setupStep === 'AWAITING_RESET_CONFIRM') {
      if (lowerInput === 'yes' || lowerInput === 'y' || lowerInput === 'haan') {
        user.setupStep = 'NONE';
        await user.save();
        return await waterService.resetTodayIntake(user);
      } else {
        user.setupStep = 'NONE';
        await user.save();
        return `❌ Reset cancel ho gaya. Aapka intake waisa hi hai.`;
      }
    }

    // 8. Command: /help / menu / how / what
    if (/^(help|commands|menu|how|what|options|info)$/i.test(lowerInput)) {
      return this._getHelpMessage();
    }

    // 9. Command: /progress
    if (lowerInput === 'progress') {
      return await waterService.getProgressReport(user);
    }

    // 10. Command: /goal
    if (lowerInput === 'goal') {
      const totalGlasses = Math.round(user.dailyGoal / 250);
      return (
        `🎯 Aapka current daily target *${user.dailyGoal} ml* (~${totalGlasses} glasses) hai.\n\n` +
        `💡 *Quick change:* */goal 3000* bhej ke update kijiye.`
      );
    }

    // 11. Command: /status
    if (lowerInput === 'status') {
      return await this._getStatusReport(user);
    }

    // 12. Command: /stop (Unsubscribe / Pause Reminders)
    if (lowerInput === 'stop' || lowerInput === 'pause' || lowerInput === 'unsubscribe') {
      user.remindersEnabled = false;
      user.isSubscribed = false;
      await user.save();
      return (
        `⏸️ *Water reminders pause kar diye gaye hain.*\n\n` +
        `Jab bhi wapas shuru karna ho, bas */start* ya */setup* bhej dena!`
      );
    }

    // 13. Command: /start (Resume Reminders)
    if (lowerInput === 'start' || lowerInput === 'resume' || lowerInput === 'subscribe') {
      user.remindersEnabled = true;
      user.isSubscribed = true;
      await user.save();
      return `▶️ *Water reminders active ho gaye hain!* Stay hydrated 💧`;
    }

    // 14. Water Intake Logging (e.g. 1 glass, 2 glasses, bottle, cup, 250, 500, pi liya, done, 1L)
    const parsedContainer = parseContainerAmount(lowerInput);
    if (parsedContainer) {
      const result = await waterService.addWaterIntake(user, parsedContainer.amount, parsedContainer.containerName);
      return result.message;
    }

    // 15. Non-command messages from subscribed users are silently ignored
    return null;
  }

  /**
   * Handle setup step transitions with graceful validation and error handling
   * @private
   */
  async _handleSetupStep(user, rawInput) {
    const input = String(rawInput || '').trim();
    const hinglish = require('../utils/hinglishTemplates');

    switch (user.setupStep) {
      // Step 1: Daily Goal
      case 'AWAITING_GOAL': {
        let goal = null;
        // Check liter format e.g. "2L", "2.5L", "2 liter", "2 litres"
        const literMatch = input.match(/^(\d+(?:\.\d+)?)\s*(?:l|liter|liters|litres|litre)$/i);
        if (literMatch) {
          goal = Math.round(parseFloat(literMatch[1]) * 1000);
        } else {
          // Check ml or plain number e.g. "2000", "2000ml", "2500"
          const goalMatch = input.match(/^(\d+)\s*(?:ml)?$/i);
          goal = goalMatch ? parseInt(goalMatch[1], 10) : null;
        }

        if (!goal || goal < 500 || goal > 15000) {
          return hinglish.getInvalidGoalMessage();
        }

        user.dailyGoal = goal;
        user.setupStep = 'AWAITING_WAKEUP';
        await user.save();

        return hinglish.getStepWakeMessage();
      }

      // Step 2: Wake-up Time
      case 'AWAITING_WAKEUP': {
        const parsedTime = parseTimeString(input, 'wake');
        if (!parsedTime.valid) {
          return hinglish.getInvalidTimeMessage('wake');
        }

        user.wakeUpTime = parsedTime.formatted;
        user.wakeUpHour = parsedTime.hour24;
        user.wakeUpMinute = parsedTime.minute;
        user.setupStep = 'AWAITING_SLEEP';
        await user.save();

        return hinglish.getStepSleepMessage();
      }

      // Step 3: Sleep Time (FINAL STEP)
      case 'AWAITING_SLEEP': {
        const parsedTime = parseTimeString(input, 'sleep');
        if (!parsedTime.valid) {
          return hinglish.getInvalidTimeMessage('sleep');
        }

        user.sleepTime = parsedTime.formatted;
        user.sleepHour = parsedTime.hour24;
        user.sleepMinute = parsedTime.minute;
        
        user.setupCompleted = true;
        user.setupStep = 'NONE';
        user.isSubscribed = true;
        user.remindersEnabled = true;
        user.lastReminderSentAt = new Date(); // Next reminder will fire after smart interval
        user.lastReminderStatus = 'NONE';
        user.nudgeSentForCurrentReminder = false;
        await user.save();

        return hinglish.getSetupCompleteMessage(user);
      }

      default: {
        user.setupStep = 'NONE';
        await user.save();
        return `Setup reset. Send */setup* to start again.`;
      }
    }
  }

  /**
   * Status report
   * @private
   */
  async _getStatusReport(user) {
    const progressText = await waterService.getProgressReport(user);
    const statusIcon = user.remindersEnabled && user.isSubscribed ? '🟢 Active (Subscribed)' : '🔴 Paused';

    return (
      `📊 *Bot Status & Configuration*\n\n` +
      `• Reminders: ${statusIcon}\n` +
      `• Daily Target: ${user.dailyGoal} ml\n` +
      `• Active Window: ${user.wakeUpTime} to ${user.sleepTime}\n` +
      `• Frequency: 🧠 Smart Auto Mode\n` +
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
    const hinglish = require('../utils/hinglishTemplates');
    return hinglish.getHelpMessageHinglish();
  }
}

module.exports = new UserService();
