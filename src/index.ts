import { generateCorrelationId } from './core/utils/correlation-id.js';
import { createWorkflowLogger } from './core/logging/workflow-logger.js';

const correlationId = generateCorrelationId();

const workflowLogger = createWorkflowLogger({
  correlationId,
  ticketId: 'TKT-1001',
  queueItemId: 'QUEUE-1001',
});

workflowLogger.info('Ticket workflow started');
workflowLogger.info('Ticket classification completed');
workflowLogger.info('Ticket workflow completed');
