const mongoose = require('mongoose');

const waterEntrySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const waterLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true
    },
    date: {
      type: String, // Format "YYYY-MM-DD" representing calendar day in user's timezone
      required: true,
      index: true
    },
    goal: {
      type: Number,
      required: true
    },
    totalConsumed: {
      type: Number,
      default: 0
    },
    entries: [waterEntrySchema],
    goalCompleted: {
      type: Boolean,
      default: false
    },
    goalCompletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure one log per user per calendar day
waterLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WaterLog', waterLogSchema);
