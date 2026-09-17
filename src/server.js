require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { initReminderJob, stopReminderJob } = require('./jobs/reminderJob');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Start the smart reminder job immediately — no WhatsApp dependency needed
    initReminderJob();
    logger.info('🧠 Smart Reminder Scheduler started');

    const server = app.listen(PORT, () => {
      logger.info(`🚀 HydroSmart API running on port ${PORT}`);
      logger.info(`👉 Health check: http://localhost:${PORT}/health`);
      logger.info(`📱 API Base: http://localhost:${PORT}/api`);
    });

    // Graceful Shutdown
    const handleShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      stopReminderJob();
      server.close(() => {
        logger.info('Server closed.');
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
