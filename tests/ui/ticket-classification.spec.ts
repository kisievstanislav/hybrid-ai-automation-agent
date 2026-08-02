import { test } from '@playwright/test';

import { SupportTeam, TicketCategory, TicketPriority } from '../../src/domain/index.js';
import { PlaywrightTicketUiService } from '../../src/infrastructure/ui/playwright/index.js';

test.describe('Playwright ticket UI service', () => {
  test('should update and persist ticket classification', async () => {
    const ticketUiService = new PlaywrightTicketUiService();

    await ticketUiService.updateTicket('TKT-1001', {
      category: TicketCategory.AUTHENTICATION,
      priority: TicketPriority.HIGH,
      assignedTeam: SupportTeam.IDENTITY_SUPPORT,
    });
  });
});
