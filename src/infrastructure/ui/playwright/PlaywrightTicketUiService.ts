import { chromium, type Browser } from '@playwright/test';

import type {
  TicketUiService,
  TicketUiUpdate,
} from '../../../application/ports/ui/TicketUiService.js';
import { appConfig } from '../../../core/config/app.config.js';
import { logger } from '../../../core/logging/index.js';
import { TicketDetailsPage } from './pages/TicketDetailsPage.js';
import { TicketQueuePage } from './pages/TicketQueuePage.js';

export class PlaywrightTicketUiService implements TicketUiService {
  async updateTicket(ticketId: string, update: TicketUiUpdate): Promise<void> {
    let browser: Browser | undefined;

    logger.info(
      {
        ticketId,
        category: update.category,
        priority: update.priority,
        assignedTeam: update.assignedTeam,
      },
      'Starting Playwright ticket update',
    );

    try {
      browser = await chromium.launch({
        headless: appConfig.browser.headless,
      });

      logger.info({ ticketId }, 'Browser started');

      const page = await browser.newPage({
        baseURL: appConfig.app.baseUrl,
      });

      const ticketQueuePage = new TicketQueuePage(page);
      const ticketDetailsPage = new TicketDetailsPage(page);

      await ticketQueuePage.open();
      await ticketQueuePage.openTicket(ticketId);

      logger.info({ ticketId }, 'Ticket details page opened');

      await ticketDetailsPage.verifyLoaded();
      await ticketDetailsPage.updateClassification(update);
      await ticketDetailsPage.save();

      logger.info({ ticketId }, 'Ticket classification saved');

      await ticketDetailsPage.reloadAndVerifyClassification(update);

      logger.info({ ticketId }, 'Ticket classification persistence verified');
    } catch (error) {
      logger.error(
        {
          ticketId,
          error,
        },
        'Playwright ticket update failed',
      );

      throw error;
    } finally {
      await browser?.close();

      logger.info({ ticketId }, 'Browser closed');
    }
  }
}
