import type { Logger } from "pino";

import { logger } from "./logger.js";

export interface WorkflowLoggerContext {
  correlationId: string;
  ticketId?: string;
  queueItemId?: string;
}

export function createWorkflowLogger(
  context: WorkflowLoggerContext,
): Logger {
  return logger.child(context);
}