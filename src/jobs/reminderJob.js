const cron = require('node-cron');
const reminderService = require('../services/reminderService');
const logger = require('../utils/logger');

let cronTask = null;

/**
 * Initialize background reminder cron scheduler
 * Runs every minute to evaluate reminder criteria
 */
const initReminderJob = () => {
  if (cronTask) {
    logger.warn('Reminder cron job already running');
    return cronTask;
  }

  // Schedule to run every minute: "* * * * *"
  cronTask = cron.schedule('* * * * *', async () => {
    logger.debug('Running recurring water reminder check...');
    await reminderService.checkAndSendReminders();
  });

  logger.info('🕒 Reminder scheduler job initialized (running every minute)');
  return cronTask;
};

/**
 * Stop background reminder cron scheduler
 */
const stopReminderJob = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('Reminder cron job stopped');
  }
};

module.exports = {
  initReminderJob,
  stopReminderJob
};
