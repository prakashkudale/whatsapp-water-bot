const express = require('express');
const cors = require('cors');
const path = require('path');
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const waterRoutes = require('./routes/waterRoutes');
const statsRoutes = require('./routes/statsRoutes');
const logger = require('./utils/logger');

const app = express();

// CORS — allow the mobile app and any local tools to connect
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse incoming JSON and url-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files for development simulator
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// Health check
app.use('/', healthRoutes);

// === HydroSmart REST API ===
app.use('/api/user', userRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/stats', statsRoutes);

// Explicit route for simulator (dev tool)
app.get('/simulator', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Centralized Error Handling
app.use((err, req, res, next) => {
  logger.error('Unhandled server error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
