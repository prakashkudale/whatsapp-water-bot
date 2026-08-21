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
    // In local development without MongoDB installed/running, we don't immediately crash the whole server
    // but log the error clearly so health checks show status.
  }
};

// Mongoose connection event listeners
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost. Reconnecting...');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err.message);
});

module.exports = connectDB;
