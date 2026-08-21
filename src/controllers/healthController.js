const mongoose = require('mongoose');

/**
 * Health check controller
 * @route GET /health
 */
const getHealth = (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    message: 'Water Reminder Bot is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
};

module.exports = {
  getHealth
};
