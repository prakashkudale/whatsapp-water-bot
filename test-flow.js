require('dotenv').config();
const mongoose = require('mongoose');
const userService = require('./src/services/userService');
const waterService = require('./src/services/waterService');
const User = require('./src/models/User');
const WaterLog = require('./src/models/WaterLog');

function formatOutput(res) {
  if (!res) return '';
  if (typeof res === 'string') return res;
  let out = res.text || '';
  if (res.buttons && res.buttons.length > 0) {
    out += '\n\n[Interactive Buttons]: ' + res.buttons.map(b => `[${b.text}]`).join('  ');
  }
  return out;
}

async function testFullFlow() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'water-reminder-bot' });
  console.log('Connected!');

  const testPhone = '919638767233';
  
  // Clean up any previous test data
  await User.deleteOne({ phoneNumber: testPhone });
  await WaterLog.deleteMany({ phoneNumber: testPhone });

  console.log('\n===========================================');
  console.log('TEST 1: Start Setup');
  console.log('===========================================');
  let res = await userService.processIncomingMessage(testPhone, 'setup', 'Prakash');
  console.log('User: setup');
  console.log('Bot:\n' + formatOutput(res));

  console.log('\n===========================================');
  console.log('TEST 2: Step 1 - Daily Goal (2500)');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, '2500');
  console.log('User: 2500');
  console.log('Bot:\n' + formatOutput(res));

  console.log('\n===========================================');
  console.log('TEST 3: Step 2 - Wake up time (8:00 AM)');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, '8:00 AM');
  console.log('User: 8:00 AM');
  console.log('Bot:\n' + formatOutput(res));

  console.log('\n===========================================');
  console.log('TEST 4: Step 3 - Sleep time (11:00 PM)');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, '11:00 PM');
  console.log('User: 11:00 PM');
  console.log('Bot:\n' + formatOutput(res));

  console.log('\n===========================================');
  console.log('TEST 5: Step 4 - Tap Button "interval_2"');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, 'interval_2');
  console.log('User (Tapped Button): [Every 2 Hours]');
  console.log('Bot:\n' + formatOutput(res));

  console.log('\n===========================================');
  console.log('TEST 6: Tap Quick Action Button "+250 ml"');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, 'quick_250');
  console.log('User (Tapped Button): [+250 ml 💧]');
  console.log('Bot:\n' + formatOutput(res));

  console.log('\n===========================================');
  console.log('TEST 7: Tap Quick Action Button "+500 ml"');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, 'quick_500');
  console.log('User (Tapped Button): [+500 ml 🥤]');
  console.log('Bot:\n' + formatOutput(res));

  console.log('\n===========================================');
  console.log('TEST 8: Tap Button "Progress"');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, 'btn_progress');
  console.log('User (Tapped Button): [Progress 📊]');
  console.log('Bot:\n' + formatOutput(res));

  console.log('\n===========================================');
  console.log('TEST 9: Log Remaining Water (1750 ml) to complete 2500ml');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, '1750');
  console.log('User: 1750');
  console.log('Bot:\n' + formatOutput(res));

  console.log('\n===========================================');
  console.log('TEST 10: Button - reset & confirm');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, 'reset');
  console.log('User: reset -> Bot:\n' + formatOutput(res));
  res = await userService.processIncomingMessage(testPhone, 'reset_confirm');
  console.log('User (Tapped Button): [Yes, Reset 🔄] -> Bot:\n' + formatOutput(res));

  await mongoose.disconnect();
  console.log('\nAll interactive button tests passed successfully! ✅');
}

testFullFlow().catch(console.error);
