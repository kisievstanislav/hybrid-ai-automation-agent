import type { QueueItem } from "../../domain/index.js";

export interface QueueRepository {
  findAll(): Promise<readonly QueueItem[]>;

  findById(id: string): Promise<QueueItem | null>;

  claimNext(): Promise<QueueItem | null>;

  update(queueItem: QueueItem): Promise<QueueItem>;
}