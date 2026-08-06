import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../../../src/infrastructure/api/app.js";
import { prisma } from "../../../src/infrastructure/database/prisma-client.js";
import { QueueItemStatus } from "../../../src/generated/prisma/enums.js";

describe("Queue routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    await prisma.queueItem.updateMany({
      data: {
        status: QueueItemStatus.NEW,
        workerId: null,
        claimedAt: null,
        completedAt: null,
        lastError: null,
      },
    });

    app = await createApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("should return all queue items", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/queue",
    });

    expect(response.statusCode).toBe(200);

    const queueItems = response.json<unknown[]>();

    expect(queueItems).toHaveLength(5);
  });

  it("should return one queue item by id", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/queue/QUEUE-1001",
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      id: "QUEUE-1001",
      ticketId: "TKT-1001",
      status: "NEW",
      correlationId: "CORR-1001",
    });
  });

  it("should return 404 when the queue item does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/queue/QUEUE-9999",
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toEqual({
      code: "QUEUE_ITEM_NOT_FOUND",
      message: "Queue item QUEUE-9999 was not found",
    });
  });

  it("should claim the oldest available queue item", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/queue/claim-next",
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      id: "QUEUE-1001",
      ticketId: "TKT-1001",
      status: "CLAIMED",
    });

    const persistedQueueItem = await prisma.queueItem.findUnique({
      where: {
        id: "QUEUE-1001",
      },
    });

    expect(persistedQueueItem?.status).toBe(QueueItemStatus.CLAIMED);
    expect(persistedQueueItem?.claimedAt).toBeInstanceOf(Date);
  });

  it("should return 204 when no queue items are available", async () => {
  await prisma.queueItem.updateMany({
    data: {
      status: QueueItemStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/queue/claim-next",
  });

  expect(response.statusCode).toBe(204);
  expect(response.body).toBe("");
});
});