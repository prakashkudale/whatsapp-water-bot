require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { initReminderJob, stopReminderJob } = require('./jobs/reminderJob');
const whatsappDirectService = require('./services/whatsappDirectService');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Start Server Function
const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();

    // Initialize background reminder scheduler
    initReminderJob();

    // If direct WhatsApp provider is active, start terminal QR connection
    if ((process.env.WHATSAPP_PROVIDER || 'direct') === 'direct') {
      whatsappDirectService.initWhatsApp();
    }

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`👉 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful Shutdown Handlers
    const handleShutdown = (signal) => {
      logger.info(`${signal} signal received. Shutting down gracefully...`);
      stopReminderJob();
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
