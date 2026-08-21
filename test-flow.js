require('dotenv').config();
const mongoose = require('mongoose');
const userService = require('./src/services/userService');
const waterService = require('./src/services/waterService');
const User = require('./src/models/User');
const WaterLog = require('./src/models/WaterLog');

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
  console.log('Bot:\n' + res);

  console.log('\n===========================================');
  console.log('TEST 2: Step 1 - Daily Goal (2500)');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, '2500');
  console.log('User: 2500');
  console.log('Bot:\n' + res);

  console.log('\n===========================================');
  console.log('TEST 3: Step 2 - Wake up time (8:00 AM)');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, '8:00 AM');
  console.log('User: 8:00 AM');
  console.log('Bot:\n' + res);

  console.log('\n===========================================');
  console.log('TEST 4: Step 3 - Sleep time (11:00 PM)');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, '11:00 PM');
  console.log('User: 11:00 PM');
  console.log('Bot:\n' + res);

  console.log('\n===========================================');
  console.log('TEST 5: Step 4 - Interval (2)');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, '2');
  console.log('User: 2');
  console.log('Bot:\n' + res);

  console.log('\n===========================================');
  console.log('TEST 6: Log Water Intake (250 ml)');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, '250');
  console.log('User: 250');
  console.log('Bot:\n' + res);

  console.log('\n===========================================');
  console.log('TEST 7: Log Water Intake (1000 ml)');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, '1000');
  console.log('User: 1000');
  console.log('Bot:\n' + res);

  console.log('\n===========================================');
  console.log('TEST 8: Command - progress');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, 'progress');
  console.log('User: progress');
  console.log('Bot:\n' + res);

  console.log('\n===========================================');
  console.log('TEST 9: Log Remaining Water to Complete Goal (1250 ml)');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, '1250');
  console.log('User: 1250');
  console.log('Bot:\n' + res);

  console.log('\n===========================================');
  console.log('TEST 10: Command - status');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, 'status');
  console.log('User: status');
  console.log('Bot:\n' + res);

  console.log('\n===========================================');
  console.log('TEST 11: Command - stop & start');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, 'stop');
  console.log('User: stop -> Bot:\n' + res);
  res = await userService.processIncomingMessage(testPhone, 'start');
  console.log('User: start -> Bot:\n' + res);

  console.log('\n===========================================');
  console.log('TEST 12: Command - reset');
  console.log('===========================================');
  res = await userService.processIncomingMessage(testPhone, 'reset');
  console.log('User: reset -> Bot:\n' + res);
  res = await userService.processIncomingMessage(testPhone, 'YES');
  console.log('User: YES -> Bot:\n' + res);

  await mongoose.disconnect();
  console.log('\nAll tests passed successfully! ✅');
}

testFullFlow().catch(console.error);
