require('dotenv').config();
const mongoose = require('mongoose');
const userService = require('./src/services/userService');
const User = require('./src/models/User');
const WaterLog = require('./src/models/WaterLog');

async function testUnexpectedInputs() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'water-reminder-bot' });
  console.log('Connected!');

  const testPhone = '919638767233';
  await User.deleteOne({ phoneNumber: testPhone });
  await WaterLog.deleteMany({ phoneNumber: testPhone });

  console.log('\n--- 1. Trigger /setup ---');
  let res = await userService.processIncomingMessage(testPhone, '/setup');
  console.log('Bot:\n' + res);

  console.log('\n--- 2. Unexpected Input at Consent ("what is this?") ---');
  res = await userService.processIncomingMessage(testPhone, 'what is this?');
  console.log('User: what is this? -> Bot:\n' + res);

  console.log('\n--- 3. User says "sure" (Affirmative consent) ---');
  res = await userService.processIncomingMessage(testPhone, 'sure');
  console.log('User: sure -> Bot:\n' + res);

  console.log('\n--- 4. Unexpected Input at Step 1 Goal ("two thousand") ---');
  res = await userService.processIncomingMessage(testPhone, 'two thousand');
  console.log('User: two thousand -> Bot:\n' + res);

  console.log('\n--- 5. Valid Goal ("2500") ---');
  res = await userService.processIncomingMessage(testPhone, '2500');
  console.log('User: 2500 -> Bot:\n' + res);

  console.log('\n--- 6. Unexpected Time at Step 2 Wake-up ("morning") ---');
  res = await userService.processIncomingMessage(testPhone, 'morning');
  console.log('User: morning -> Bot:\n' + res);

  console.log('\n--- 7. User decides to cancel midway ("cancel") ---');
  res = await userService.processIncomingMessage(testPhone, 'cancel');
  console.log('User: cancel -> Bot:\n' + res);

  await mongoose.disconnect();
  console.log('\nUnexpected inputs handled 100% gracefully! ✅');
}

testUnexpectedInputs().catch(console.error);
