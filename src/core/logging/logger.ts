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
    redact: {
      paths: [
        'password',
        'token',
        'accessToken',
        'refreshToken',
        'apiKey',
        'authorization',
        'headers.authorization',
        'req.headers.authorization',
      ],
      censor: '[REDACTED]',
    },
  },
  transport ? pino.transport(transport) : undefined,
);