require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const WaterLog = require('./src/models/WaterLog');

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'water-reminder-bot' });
  
  const allowedNumbers = ['919638767233', '9638767233', '14899426099415'];

  // Delete any dummy or unknown numbers
  const resUser = await User.deleteMany({ phoneNumber: { $nin: allowedNumbers } });
  const resLog = await WaterLog.deleteMany({ phoneNumber: { $nin: allowedNumbers } });

  console.log(`Cleaned up DB: Deleted ${resUser.deletedCount} unknown users and ${resLog.deletedCount} logs.`);

  const remaining = await User.find({}, { phoneNumber: 1, dailyGoal: 1, isSubscribed: 1, _id: 0 });
  console.log('Remaining Active DB Users:', JSON.stringify(remaining));

  await mongoose.disconnect();
}

clean().catch(console.error);
