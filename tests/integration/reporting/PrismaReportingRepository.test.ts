import { afterAll, describe, expect, it } from 'vitest';
import { PrismaReportingRepository } from '../../../src/infrastructure/persistence/repositories/PrismaReportingRepository.js';
import { prisma } from '../../../src/infrastructure/database/prisma-client.js';

describe('PrismaReportingRepository', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return reporting records from the database', async () => {
    const repository = new PrismaReportingRepository();

    const records = await repository.findAllMetricsRecords();

    expect(Array.isArray(records)).toBe(true);

    for (const record of records) {
      expect(record.status).toBeDefined();
      expect(record.attemptCount).toBeGreaterThanOrEqual(0);
      expect(record.createdAt).toBeInstanceOf(Date);
    }
  });
});
