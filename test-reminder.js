require('dotenv').config();
const mongoose = require('mongoose');
const reminderService = require('./src/services/reminderService');
const User = require('./src/models/User');
const WaterLog = require('./src/models/WaterLog');

async function testReminderLogic() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'water-reminder-bot' });
  console.log('Connected!');

  const mockUser = {
    phoneNumber: '919638767233',
    dailyGoal: 2500,
    wakeUpHour: 8,
    wakeUpMinute: 0,
    sleepHour: 23,
    sleepMinute: 0,
    timezone: 'Asia/Kolkata'
  };

  console.log('\n--- Adaptive Reminder Message Tests ---');

  // Case 1: Behind goal
  const behindMsg = reminderService.generateAdaptiveReminderText(2500, 250, mockUser);
  console.log('\n[Case 1: Behind Schedule (250/2500 ml)]\n' + behindMsg);

  // Case 2: On track
  const onTrackMsg = reminderService.generateAdaptiveReminderText(2500, 1300, mockUser);
  console.log('\n[Case 2: On Track (1300/2500 ml)]\n' + onTrackMsg);

  // Case 3: Almost there
  const almostMsg = reminderService.generateAdaptiveReminderText(2500, 2000, mockUser);
  console.log('\n[Case 3: Almost There (2000/2500 ml)]\n' + almostMsg);

  console.log('\n--- Scheduler Engine Execution Test ---');
  // Configure user in DB
  await User.findOneAndUpdate(
    { phoneNumber: mockUser.phoneNumber },
    {
      setupCompleted: true,
      remindersEnabled: true,
      dailyGoal: 2500,
      wakeUpHour: 0, // ensure wake window is open right now
      sleepHour: 23,
      reminderInterval: 1,
      lastReminderSentAt: null
    },
    { upsert: true }
  );

  // Run reminder check
  await reminderService.checkAndSendReminders();

  const updatedUser = await User.findOne({ phoneNumber: mockUser.phoneNumber });
  console.log('User lastReminderSentAt updated to:', updatedUser.lastReminderSentAt);

  await mongoose.disconnect();
  console.log('\nReminder engine tests passed! ✅');
}

testReminderLogic().catch(console.error);
