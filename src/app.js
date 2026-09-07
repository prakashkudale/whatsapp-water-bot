const express = require('express');
const path = require('path');
const healthRoutes = require('./routes/healthRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const logger = require('./utils/logger');

const app = express();

// Parse incoming JSON and url-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files for the Interactive Simulator
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/', healthRoutes);
app.use('/', webhookRoutes);
app.use('/', simulationRoutes);

// Explicit route for simulator
app.get('/simulator', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 Handler for undefined API routes
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
