import type { FastifyInstance } from 'fastify';
import { createReportingService } from '../../reporting/createReportingService.js';

export async function reportingRoutes(app: FastifyInstance): Promise<void> {
  const reportingService = createReportingService();

  app.get('/metrics', async () => {
    return reportingService.generateSummary();
  });
}
