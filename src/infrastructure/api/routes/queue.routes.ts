import type { FastifyInstance } from "fastify";

import type { QueueService } from "../../../application/services/index.js";

interface QueueRouteOptions {
  readonly queueService: QueueService;
}

interface QueueItemParams {
  readonly id: string;
}

export async function registerQueueRoutes(
  app: FastifyInstance,
  options: QueueRouteOptions,
): Promise<void> {
  const { queueService } = options;

  app.get("/queue", async (_request, reply) => {
    const queueItems = await queueService.getAllQueueItems();

    return reply.status(200).send(queueItems);
  });

  app.get<{ Params: QueueItemParams }>(
    "/queue/:id",
    async (request, reply) => {
      const queueItem = await queueService.getQueueItemById(
        request.params.id,
      );

      if (!queueItem) {
        return reply.status(404).send({
          code: "QUEUE_ITEM_NOT_FOUND",
          message: `Queue item ${request.params.id} was not found`,
        });
      }

      return reply.status(200).send(queueItem);
    },
  );

  app.post("/queue/claim-next", async (_request, reply) => {
    const queueItem =
  await queueService.claimNextQueueItem(
    "api-worker",
  );

    if (!queueItem) {
      return reply.status(204).send();
    }

    return reply.status(200).send(queueItem);
  });
}