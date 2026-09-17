const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'hydrosmart_secret_key';
const JWT_EXPIRES = '30d';

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

/**
 * POST /api/user/register
 * Register a new user with phone number and name
 */
const register = async (req, res) => {
  try {
    const { phoneNumber, name, password } = req.body;
    if (!phoneNumber || !name || !password) {
      return res.status(400).json({ success: false, message: 'phoneNumber, name and password are required' });
    }

    const cleanPhone = String(phoneNumber).replace(/\D/g, '').slice(0, 15);
    const existing = await User.findOne({ phoneNumber: cleanPhone });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      phoneNumber: cleanPhone,
      name: String(name).trim().slice(0, 100),
      password: hashed,
      isSubscribed: true,
      consentGiven: true,
      consentDate: new Date(),
      remindersEnabled: true,
      setupCompleted: false,
      setupStep: 'NONE'
    });

    logger.info(`✅ New user registered: ${cleanPhone}`);
    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        dailyGoal: user.dailyGoal,
        setupCompleted: user.setupCompleted
      }
    });
  } catch (err) {
    logger.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/user/login
 */
const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
      return res.status(400).json({ success: false, message: 'phoneNumber and password are required' });
    }

    const cleanPhone = String(phoneNumber).replace(/\D/g, '').slice(0, 15);
    const user = await User.findOne({ phoneNumber: cleanPhone });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        dailyGoal: user.dailyGoal,
        wakeUpTime: user.wakeUpTime,
        sleepTime: user.sleepTime,
        setupCompleted: user.setupCompleted,
        remindersEnabled: user.remindersEnabled,
        timezone: user.timezone
      }
    });
  } catch (err) {
    logger.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/user/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        dailyGoal: user.dailyGoal,
        wakeUpTime: user.wakeUpTime,
        sleepTime: user.sleepTime,
        setupCompleted: user.setupCompleted,
        remindersEnabled: user.remindersEnabled,
        timezone: user.timezone,
        lastDrinkTime: user.lastDrinkTime
      }
    });
  } catch (err) {
    logger.error('GetProfile error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/user/setup
 * Update goal, wake time, sleep time, reminders enabled
 */
const updateSetup = async (req, res) => {
  try {
    const user = req.user;
    const { dailyGoal, wakeUpTime, wakeUpHour, wakeUpMinute, sleepTime, sleepHour, sleepMinute, remindersEnabled, name } = req.body;

    if (dailyGoal !== undefined) {
      const g = parseInt(dailyGoal, 10);
      if (g >= 500 && g <= 15000) user.dailyGoal = g;
    }
    if (name) user.name = String(name).trim().slice(0, 100);
    if (wakeUpTime) user.wakeUpTime = wakeUpTime;
    if (wakeUpHour !== undefined) user.wakeUpHour = parseInt(wakeUpHour, 10);
    if (wakeUpMinute !== undefined) user.wakeUpMinute = parseInt(wakeUpMinute, 10);
    if (sleepTime) user.sleepTime = sleepTime;
    if (sleepHour !== undefined) user.sleepHour = parseInt(sleepHour, 10);
    if (sleepMinute !== undefined) user.sleepMinute = parseInt(sleepMinute, 10);
    if (remindersEnabled !== undefined) user.remindersEnabled = Boolean(remindersEnabled);

    user.setupCompleted = true;
    user.setupStep = 'NONE';
    await user.save();

    logger.info(`User ${user.phoneNumber} updated setup`);
    res.json({ success: true, message: 'Settings saved!', user: { dailyGoal: user.dailyGoal, wakeUpTime: user.wakeUpTime, sleepTime: user.sleepTime, remindersEnabled: user.remindersEnabled } });
  } catch (err) {
    logger.error('UpdateSetup error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/user/push-token
 * Store Expo push token for this device
 */
const updatePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    if (!expoPushToken) {
      return res.status(400).json({ success: false, message: 'expoPushToken is required' });
    }

    req.user.expoPushToken = expoPushToken;
    await req.user.save();

    res.json({ success: true, message: 'Push token registered' });
  } catch (err) {
    logger.error('UpdatePushToken error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getProfile, updateSetup, updatePushToken };
