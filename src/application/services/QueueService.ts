import type { QueueRepository } from "../repositories/index.js";
import type { QueueItem } from "../../domain/index.js";

export class QueueService {
  constructor(
    private readonly queueRepository: QueueRepository,
  ) {}

  async getAllQueueItems(): Promise<readonly QueueItem[]> {
    return this.queueRepository.findAll();
  }

  async getQueueItemById(id: string): Promise<QueueItem | null> {
    return this.queueRepository.findById(id);
  }

  async claimNextQueueItem(): Promise<QueueItem | null> {
    return this.queueRepository.claimNext();
  }

  async updateQueueItem(queueItem: QueueItem): Promise<QueueItem> {
    return this.queueRepository.update(queueItem);
  }
}