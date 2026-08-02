import Fastify, { type FastifyInstance } from 'fastify';

import { QueueService, TicketService } from '../../application/services/index.js';
import {
  PrismaQueueRepository,
  PrismaTicketRepository,
} from '../persistence/repositories/index.js';
import { registerQueueRoutes } from './routes/queue.routes.js';
import { registerTicketRoutes } from './routes/ticket.routes.js';
import { registerTicketUiRoutes } from '../ui/ticket-ui.routes.js';

export function createApp(): FastifyInstance {
  const app = Fastify({
    logger: false,
  });

  const ticketRepository = new PrismaTicketRepository();
  const queueRepository = new PrismaQueueRepository();

  const ticketService = new TicketService(ticketRepository);
  const queueService = new QueueService(queueRepository);

  app.get('/health', async () => {
    return {
      status: 'ok',
    };
  });

  app.register(registerTicketRoutes, {
    ticketService,
  });

  app.register(registerQueueRoutes, {
    queueService,
  });

  app.register(registerTicketUiRoutes, {
    ticketService,
  });

  return app;
}
