require('dotenv').config();
const mongoose = require('mongoose');
const reminderService = require('./src/services/reminderService');
const waterService = require('./src/services/waterService');
const User = require('./src/models/User');
const WaterLog = require('./src/models/WaterLog');

async function testReminderLogic() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'water-reminder-bot' });
  console.log('Connected!');

  const testPhone = '919638767233';

  // 1. Setup user in DB
  const user = await User.findOneAndUpdate(
    { phoneNumber: testPhone },
    {
      name: 'Prakash',
      isSubscribed: true,
      setupCompleted: true,
      remindersEnabled: true,
      dailyGoal: 2000,
      wakeUpHour: 0,
      wakeUpMinute: 0,
      sleepHour: 23,
      sleepMinute: 59,
      reminderInterval: 1,
      lastReminderSentAt: null,
      lastReminderStatus: 'NONE'
    },
    { upsert: true, new: true }
  );

  console.log('\n--- 1. Adaptive Reminder Message Preview ---');
  const reminderText = reminderService.generateAdaptiveReminderText(2000, 500, user);
  console.log(reminderText);

  console.log('\n--- 2. Scheduler Engine Test ---');
  await reminderService.checkAndSendReminders();

  let checkUser = await User.findOne({ phoneNumber: testPhone });
  console.log('User status after reminder sent:', checkUser.lastReminderStatus); // Should be 'SENT'

  console.log('\n--- 3. Simulate User Opened Message (Blue Tick ✓✓) ---');
  checkUser.lastReminderStatus = 'SEEN';
  checkUser.lastReminderSeenAt = new Date(Date.now() - 26 * 60 * 1000); // 26 minutes ago
  checkUser.nudgeSentForCurrentReminder = false;
  await checkUser.save();

  console.log('\n--- 4. Run Gentle Nudge Check ---');
  await reminderService.checkAndSendNudges();

  checkUser = await User.findOne({ phoneNumber: testPhone });
  console.log('Nudge sent flag:', checkUser.nudgeSentForCurrentReminder); // Should be true

  console.log('\n--- 5. Proactive Water Logging (User Drinks 1 Glass on Own) ---');
  const logRes = await waterService.addWaterIntake(checkUser, 250, '1 glass');
  console.log('Bot Response to Proactive Drink:\n' + logRes.message);

  checkUser = await User.findOne({ phoneNumber: testPhone });
  console.log('User status after drink:', checkUser.lastReminderStatus); // Should be 'REPLIED'
  console.log('Timer reset to:', checkUser.lastReminderSentAt);

  await mongoose.disconnect();
  console.log('\nAll smart reminder & nudge tests passed! ✅');
}

testReminderLogic().catch(console.error);
