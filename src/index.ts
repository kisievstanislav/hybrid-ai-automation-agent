import {
  ApiError,
  BaseAppError,
  logError,
} from './core/errors/index.js';

try {
  throw new ApiError('Ticket API is temporarily unavailable');
} catch (error: unknown) {
  if (error instanceof BaseAppError) {
    logError(error);
  } else {
    throw error;
  }
}