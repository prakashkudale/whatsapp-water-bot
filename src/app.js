const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const logger = require('./utils/logger');

const app = express();

// Parse incoming JSON and url-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/', healthRoutes);
app.use('/', webhookRoutes);

// Root route welcome/health pointer
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to WhatsApp Water Reminder Bot API. Check /health for status.'
  });
});

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled server error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
