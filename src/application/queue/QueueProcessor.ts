import type { QueueItem } from '../../domain/index.js';
import type { QueueProcessingResult } from './QueueProcessingResult.js';

export interface QueueProcessor {
  process(queueItem: QueueItem): Promise<QueueProcessingResult>;
}
