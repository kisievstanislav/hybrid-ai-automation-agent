import pino from 'pino';
import { environment } from '../config/environment.js';

const transport =
  environment.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      }
    : undefined;

export const logger = pino(
  {
    level: environment.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport ? pino.transport(transport) : undefined,
);