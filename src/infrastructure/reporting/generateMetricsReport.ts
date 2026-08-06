import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { prisma } from '../database/prisma-client.js';
import { createReportingService } from './createReportingService.js';

async function generateMetricsReport(): Promise<void> {
  const reportingService = createReportingService();
  const summary = await reportingService.generateSummary();

  const reportsDirectory = resolve('reports');
  const reportPath = resolve(reportsDirectory, 'processing-metrics.json');

  await mkdir(reportsDirectory, {
    recursive: true,
  });

  await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log(`Metrics report created: ${reportPath}`);
}

try {
  await generateMetricsReport();
} finally {
  await prisma.$disconnect();
}
