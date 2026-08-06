import type { ProcessingMetricsSummary } from '../models/ProcessingMetricsSummary.js';
import { ReportingRepository } from '../models/ReportingRepository.js';
import { ProcessingMetricsCalculator } from './ProcessingMetricsCalculator.js';

export class ReportingService {
  constructor(
    private readonly reportingRepository: ReportingRepository,
    private readonly metricsCalculator: ProcessingMetricsCalculator,
  ) {}

  async generateSummary(): Promise<ProcessingMetricsSummary> {
    const records = await this.reportingRepository.findAllMetricsRecords();

    return this.metricsCalculator.calculate(records);
  }
}
