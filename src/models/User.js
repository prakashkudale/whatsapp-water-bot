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
    name: {
      type: String,
      default: '',
      trim: true
    },
    dailyGoal: {
      type: Number,
      default: 2500, // in ml
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
      default: 2, // in hours
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
      enum: ['NONE', 'AWAITING_GOAL', 'AWAITING_WAKEUP', 'AWAITING_SLEEP', 'AWAITING_INTERVAL', 'AWAITING_RESET_CONFIRM'],
      default: 'NONE'
    },
    lastReminderSentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
