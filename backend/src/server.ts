import { buildApp } from './app.js';
import { config } from './common/config.js';

async function startServer() {
  const app = await buildApp();

  // Graceful shutdown handlers
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}. Closing server gracefully...`);
      try {
        await app.close();
        app.log.info('Server closed successfully.');
        process.exit(0);
      } catch (err) {
        app.log.error(err, 'Error occurred while closing server.');
        process.exit(1);
      }
    });
  });

  try {
    await app.listen({
      port: config.PORT,
      host: config.HOST,
    });
    app.log.info(
      `🌸 Bloomncharms Backend running at http://${config.HOST === '0.0.0.0' ? 'localhost' : config.HOST}:${config.PORT}`
    );
  } catch (err) {
    app.log.error(err, 'Failed to start Bloomncharms backend server.');
    process.exit(1);
  }
}

startServer();
