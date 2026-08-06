import { ProcessingMetricsCalculator } from '../../application/reporting/services/ProcessingMetricsCalculator.js';
import { ReportingService } from '../../application/reporting/services/ReportingService.js';
import { PrismaReportingRepository } from '../persistence/repositories/PrismaReportingRepository.js';

export function createReportingService(): ReportingService {
  const reportingRepository = new PrismaReportingRepository();
  const metricsCalculator = new ProcessingMetricsCalculator();

  return new ReportingService(reportingRepository, metricsCalculator);
}
