import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { createApp } from '../../../src/infrastructure/api/app.js';
import { prisma } from '../../../src/infrastructure/database/prisma-client.js';

describe('Reporting routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should return processing metrics', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/metrics',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body).toEqual(
      expect.objectContaining({
        totalItems: expect.any(Number),
        completedCount: expect.any(Number),
        failedCount: expect.any(Number),
        humanReviewCount: expect.any(Number),
        retryPendingCount: expect.any(Number),
        deadLetterCount: expect.any(Number),
        totalRetryAttempts: expect.any(Number),
        successRate: expect.any(Number),
        failureRate: expect.any(Number),
        humanReviewRate: expect.any(Number),
        generatedAt: expect.any(String),
      }),
    );
  });
});
