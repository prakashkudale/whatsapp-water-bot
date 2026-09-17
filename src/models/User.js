const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      default: null
    },
    expoPushToken: {
      type: String,
      default: null
    },
    whatsappJid: {
      type: String,
      default: null,
      trim: true
    },
    name: {
      type: String,
      default: '',
      trim: true
    },
    isSubscribed: {
      type: Boolean,
      default: false,
      index: true
    },
    consentGiven: {
      type: Boolean,
      default: false
    },
    consentDate: {
      type: Date,
      default: null
    },
    dailyGoal: {
      type: Number,
      default: 2000, // in ml
      min: 100,
      max: 20000
    },
    wakeUpTime: {
      type: String,
      default: '8:00 AM'
    },
    wakeUpHour: {
      type: Number,
      default: 8 // 0-23
    },
    wakeUpMinute: {
      type: Number,
      default: 0
    },
    sleepTime: {
      type: String,
      default: '11:00 PM'
    },
    sleepHour: {
      type: Number,
      default: 23 // 0-23
    },
    sleepMinute: {
      type: Number,
      default: 0
    },
    reminderInterval: {
      type: Number,
      default: 1, // in hours
      min: 1,
      max: 12
    },
    timezone: {
      type: String,
      default: process.env.TIMEZONE || 'Asia/Kolkata'
    },
    remindersEnabled: {
      type: Boolean,
      default: true
    },
    setupCompleted: {
      type: Boolean,
      default: false
    },
    setupStep: {
      type: String,
      enum: ['NONE', 'AWAITING_CONSENT', 'AWAITING_GOAL', 'AWAITING_WAKEUP', 'AWAITING_SLEEP', 'AWAITING_INTERVAL', 'AWAITING_RESET_CONFIRM'],
      default: 'NONE'
    },
    // Smart Read Receipt & Reminder Tracking
    lastReminderMessageId: {
      type: String,
      default: null
    },
    lastReminderSentAt: {
      type: Date,
      default: null
    },
    lastReminderSeenAt: {
      type: Date,
      default: null
    },
    lastReminderStatus: {
      type: String,
      enum: ['NONE', 'SENT', 'SEEN', 'REPLIED'],
      default: 'NONE'
    },
    nudgeSentForCurrentReminder: {
      type: Boolean,
      default: false
    },
    lastDrinkTime: {
      type: Date,
      default: null
    },
    // Daily Morning Kickoff & Bedtime Recap Tracking
    lastMorningKickoffDate: {
      type: String, // 'YYYY-MM-DD'
      default: null
    },
    lastEveningRecapDate: {
      type: String, // 'YYYY-MM-DD'
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
