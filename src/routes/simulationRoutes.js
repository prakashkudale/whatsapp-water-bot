const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const waterService = require('../services/waterService');
const User = require('../models/User');
const WaterLog = require('../models/WaterLog');
const { parseTimeString, getPreviousDateString } = require('../utils/timeUtils');
const { parseContainerAmount } = require('../utils/progressUtils');
const hinglish = require('../utils/hinglishTemplates');
const logger = require('../utils/logger');

// Your phone number used for simulator
const DEFAULT_SIMULATOR_PHONE = '919638767233';

const sanitizePhone = (input) => {
  return String(input || DEFAULT_SIMULATOR_PHONE).replace(/[^\w]/g, '').slice(0, 30);
};

/**
 * POST /api/simulator/chat
 * Simulates an incoming message with Funny Hinglish response templates
 */
router.post('/api/simulator/chat', async (req, res) => {
  try {
    const { message, phoneNumber = DEFAULT_SIMULATOR_PHONE, name = 'Prakash' } = req.body;
    const cleanPhone = sanitizePhone(phoneNumber);

    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty' });
    }

    const cleanMsg = String(message).slice(0, 500).trim();
    const cleanCmd = cleanMsg.startsWith('/') ? cleanMsg.substring(1).trim() : cleanMsg;
    const lowerInput = cleanCmd.toLowerCase();

    // Get or create user
    let user = await User.findOne({ phoneNumber: cleanPhone });
    if (!user) {
      user = await userService.getOrCreateUser(cleanPhone, name);
    }

    let reply = null;

    // Check if user is invoking setup/subscription
    const isSetupCmd = /^(setup|start|water|stup|settup|set up|subscribe|join|hi|hello|hey)$/i.test(lowerInput);

    if (isSetupCmd) {
      user.setupStep = 'AWAITING_CONSENT';
      await user.save();
      reply = hinglish.getWelcomeConsentMessage();
    } else if (user.setupStep === 'AWAITING_CONSENT') {
      const isAffirmative = /^(yes|y|agree|sure|ok|start|yep|yeah|haan|ha|sahi hai)$/i.test(lowerInput);
      const isNegative = /^(no|n|cancel|stop|exit|disagree|nope|never|nahi|na)$/i.test(lowerInput);

      if (isAffirmative) {
        user.isSubscribed = true;
        user.consentGiven = true;
        user.consentDate = new Date();
        user.remindersEnabled = true;
        user.setupStep = 'AWAITING_GOAL';
        await user.save();
        reply = hinglish.getStepGoalMessage();
      } else if (isNegative) {
        user.setupStep = 'NONE';
        user.isSubscribed = false;
        user.remindersEnabled = false;
        await user.save();
        reply = hinglish.getConsentCancelMessage();
      } else {
        reply = hinglish.getInvalidConsentMessage();
      }
    } else if (user.setupStep && user.setupStep !== 'NONE') {
      if (lowerInput === 'cancel' || lowerInput === 'exit' || lowerInput === 'stop') {
        user.setupStep = 'NONE';
        await user.save();
        reply = `❌ *Setup cancel ho gaya.* Naye sire se shuru karne ke liye */setup* bhejo.`;
      } else {
        switch (user.setupStep) {
          case 'AWAITING_GOAL': {
            let goal = null;
            const literMatch = cleanMsg.match(/^(\d+(?:\.\d+)?)\s*(?:l|liter|liters|litres|litre)$/i);
            if (literMatch) {
              goal = Math.round(parseFloat(literMatch[1]) * 1000);
            } else {
              const goalMatch = cleanMsg.match(/^(\d+)\s*(?:ml)?$/i);
              goal = goalMatch ? parseInt(goalMatch[1], 10) : null;
            }

            if (!goal || goal < 500 || goal > 15000) {
              reply = hinglish.getInvalidGoalMessage();
            } else {
              user.dailyGoal = goal;
              user.setupStep = 'AWAITING_WAKEUP';
              await user.save();
              reply = hinglish.getStepWakeMessage();
            }
            break;
          }

          case 'AWAITING_WAKEUP': {
            const parsedTime = parseTimeString(cleanMsg, 'wake');
            if (!parsedTime.valid) {
              reply = hinglish.getInvalidTimeMessage('wake');
            } else {
              user.wakeUpTime = parsedTime.formatted;
              user.wakeUpHour = parsedTime.hour24;
              user.wakeUpMinute = parsedTime.minute;
              user.setupStep = 'AWAITING_SLEEP';
              await user.save();
              reply = hinglish.getStepSleepMessage();
            }
            break;
          }

          case 'AWAITING_SLEEP': {
            const parsedTime = parseTimeString(cleanMsg, 'sleep');
            if (!parsedTime.valid) {
              reply = hinglish.getInvalidTimeMessage('sleep');
            } else {
              user.sleepTime = parsedTime.formatted;
              user.sleepHour = parsedTime.hour24;
              user.sleepMinute = parsedTime.minute;
              user.setupStep = 'AWAITING_INTERVAL';
              await user.save();
              reply = hinglish.getStepIntervalMessage();
            }
            break;
          }

          case 'AWAITING_INTERVAL': {
            const intervalMatch = cleanMsg.match(/(?:every\s+|har\s+)?(\d+)\s*(?:hours?|hrs?|h|ghante?|ghanta)?/i);
            const interval = intervalMatch ? parseInt(intervalMatch[1], 10) : null;

            if (!interval || interval < 1 || interval > 12) {
              reply = hinglish.getInvalidIntervalMessage();
            } else {
              user.reminderInterval = interval;
              user.setupCompleted = true;
              user.setupStep = 'NONE';
              user.isSubscribed = true;
              user.remindersEnabled = true;
              user.lastReminderSentAt = new Date();
              user.lastReminderStatus = 'NONE';
              user.nudgeSentForCurrentReminder = false;
              await user.save();
              reply = hinglish.getSetupCompleteMessage(user);
            }
            break;
          }

          default: {
            user.setupStep = 'NONE';
            await user.save();
            reply = `Setup reset. Send */setup* to start.`;
          }
        }
      }
    } else if (lowerInput === 'undo' || lowerInput === 'remove last') {
      const log = await waterService.getOrCreateTodayLog(user);
      if (!log.entries || log.entries.length === 0) {
        reply = `ℹ️ Aaj koi drink log nahi hua hai jise undo kiya ja sake.`;
      } else {
        const lastEntry = log.entries.pop();
        log.totalConsumed = Math.max(0, log.totalConsumed - lastEntry.amount);
        if (log.totalConsumed < log.goal) {
          log.goalCompleted = false;
          log.goalCompletedAt = null;
        }
        await log.save();
        reply = hinglish.formatUndoHinglish(lastEntry.amount, log.totalConsumed, log.goal);
      }
    } else if (lowerInput === 'progress') {
      const log = await waterService.getOrCreateTodayLog(user);
      reply = hinglish.formatProgressReportHinglish(log.goal, log.totalConsumed);
    } else if (/^(help|commands|menu|how|what|options|info)$/i.test(lowerInput)) {
      reply = hinglish.getHelpMessageHinglish();
    } else {
      // Check water intake logging
      const parsedContainer = parseContainerAmount(lowerInput);
      if (parsedContainer) {
        const log = await waterService.getOrCreateTodayLog(user);
        const wasCompletedBefore = log.goalCompleted;
        log.totalConsumed += parsedContainer.amount;
        log.entries.push({
          amount: parsedContainer.amount,
          timestamp: new Date()
        });

        let justCompletedGoal = false;
        if (!wasCompletedBefore && log.totalConsumed >= log.goal) {
          log.goalCompleted = true;
          log.goalCompletedAt = new Date();
          justCompletedGoal = true;
        }
        await log.save();

        const now = new Date();
        user.lastDrinkTime = now;
        user.lastReminderSentAt = now;
        user.lastReminderStatus = 'REPLIED';
        user.nudgeSentForCurrentReminder = false;
        await user.save();

        reply = hinglish.formatWaterAddedHinglish(
          parsedContainer.amount,
          log.goal,
          log.totalConsumed,
          justCompletedGoal,
          parsedContainer.containerName
        );
      } else {
        // Fall back to general service message handler
        reply = await userService.processIncomingMessage(cleanPhone, cleanMsg, name);
      }
    }

    const updatedUser = await User.findOne({ phoneNumber: cleanPhone });
    const updatedLog = updatedUser ? await waterService.getOrCreateTodayLog(updatedUser) : null;

    res.status(200).json({
      success: true,
      reply: reply || null,
      userState: updatedUser,
      waterLog: updatedLog,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error) {
    logger.error('Simulator chat error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/simulator/status
 * Fetches the current database state for the user
 */
router.get('/api/simulator/status', async (req, res) => {
  try {
    const cleanPhone = sanitizePhone(req.query.phone);
    const user = await User.findOne({ phoneNumber: cleanPhone });
    const log = user ? await waterService.getOrCreateTodayLog(user) : null;

    res.status(200).json({
      success: true,
      user,
      log
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/simulator/trigger-morning
 * Simulates Good Morning Kickoff in Funny Hinglish
 */
router.post('/api/simulator/trigger-morning', async (req, res) => {
  try {
    const cleanPhone = sanitizePhone(req.body.phone);
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user || !user.isSubscribed) {
      return res.status(400).json({ success: false, error: 'User must complete /setup and be subscribed.' });
    }

    const yesterdayDate = getPreviousDateString(user.timezone);
    const yesterdayLog = await WaterLog.findOne({ userId: user._id, date: yesterdayDate });
    const kickoffText = hinglish.getMorningKickoffMessage(user, yesterdayLog);

    const todayLog = await waterService.getOrCreateTodayLog(user);

    res.status(200).json({
      success: true,
      kickoffText,
      userState: user,
      waterLog: todayLog,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/simulator/trigger-bedtime
 * Simulates End-of-Day Bedtime Final Recap in Funny Hinglish
 */
router.post('/api/simulator/trigger-bedtime', async (req, res) => {
  try {
    const cleanPhone = sanitizePhone(req.body.phone);
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user || !user.isSubscribed) {
      return res.status(400).json({ success: false, error: 'User must complete /setup and be subscribed.' });
    }

    const todayLog = await waterService.getOrCreateTodayLog(user);
    const recapText = hinglish.getBedtimeRecapMessage(user, todayLog);

    res.status(200).json({
      success: true,
      recapText,
      userState: user,
      waterLog: todayLog,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/simulator/trigger-reminder
 * Simulates scheduled reminder in Funny Hinglish
 */
router.post('/api/simulator/trigger-reminder', async (req, res) => {
  try {
    const cleanPhone = sanitizePhone(req.body.phone);
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user || !user.isSubscribed) {
      return res.status(400).json({
        success: false,
        error: 'User must complete /setup and be subscribed before receiving reminders.'
      });
    }

    const log = await waterService.getOrCreateTodayLog(user);
    const reminderText = hinglish.getAdaptiveReminderMessage(log.goal, log.totalConsumed, user);

    user.lastReminderSentAt = new Date();
    user.lastReminderStatus = 'SENT';
    user.nudgeSentForCurrentReminder = false;
    await user.save();

    res.status(200).json({
      success: true,
      reminderText,
      userState: user,
      waterLog: log,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/simulator/simulate-seen
 * Simulates the user opening the message in WhatsApp (Blue Tick ✓✓)
 */
router.post('/api/simulator/simulate-seen', async (req, res) => {
  try {
    const cleanPhone = sanitizePhone(req.body.phone);
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.lastReminderStatus = 'SEEN';
    user.lastReminderSeenAt = new Date();
    await user.save();

    const log = await waterService.getOrCreateTodayLog(user);

    res.status(200).json({
      success: true,
      message: 'Simulated Read Receipt: Message marked as SEEN (Blue Tick ✓✓)',
      userState: user,
      waterLog: log
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/simulator/simulate-nudge
 * Simulates 25 minutes passing after seeing message -> fires gentle nudge in Funny Hinglish
 */
router.post('/api/simulator/simulate-nudge', async (req, res) => {
  try {
    const cleanPhone = sanitizePhone(req.body.phone);
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user || !user.isSubscribed) {
      return res.status(400).json({ success: false, error: 'User is not subscribed.' });
    }

    const log = await waterService.getOrCreateTodayLog(user);
    if (log.goalCompleted || log.totalConsumed >= log.goal) {
      return res.status(400).json({ success: false, error: 'Goal already completed for today!' });
    }

    const nudgeText = hinglish.getGentleNudgeMessage();

    user.nudgeSentForCurrentReminder = true;
    await user.save();

    res.status(200).json({
      success: true,
      nudgeText,
      userState: user,
      waterLog: log,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/simulator/reset
 * Resets user state in DB
 */
router.post('/api/simulator/reset', async (req, res) => {
  try {
    const cleanPhone = sanitizePhone(req.body.phone);
    await User.deleteOne({ phoneNumber: cleanPhone });
    await WaterLog.deleteMany({ phoneNumber: cleanPhone });

    res.status(200).json({
      success: true,
      message: 'State reset successfully. You can now start /setup fresh in Hinglish!'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

