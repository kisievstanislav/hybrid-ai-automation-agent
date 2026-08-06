import { appConfig } from '../../core/config/app.config.js';
import { logger } from '../../core/logging/index.js';
import { createApp } from './app.js';

const app = await createApp();

const port = Number(new URL(appConfig.app.baseUrl).port || 3001);
const host = '0.0.0.0';

try {
  await app.listen({
    host,
    port,
  });

  logger.info(
    {
      host,
      port,
    },
    'Fastify server started',
  );
} catch (error) {
  logger.error(error, 'Failed to start Fastify server');
  process.exit(1);
}
