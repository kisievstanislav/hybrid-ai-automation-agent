import type { ProcessingMetricsRecord } from '../models/ProcessingMetricsRecord.js';

export interface ReportingRepository {
  findAllMetricsRecords(): Promise<readonly ProcessingMetricsRecord[]>;
}
