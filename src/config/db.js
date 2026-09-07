const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error('MONGODB_URI environment variable is not defined.');
    throw new Error('MONGODB_URI is missing');
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'water-reminder-bot',
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
  }
};

// Mongoose connection event listeners
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost. Reconnecting...');
  try {
    const securityService = require('../services/securityService');
    securityService.notifyOwner('⚠️ MongoDB Connection Lost', 'The database connection was dropped. Automatic reconnection is in progress.').catch(() => {});
  } catch (e) {}
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err.message);
});

module.exports = connectDB;
