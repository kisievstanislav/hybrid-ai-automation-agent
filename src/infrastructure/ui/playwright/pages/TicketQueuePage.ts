import { expect, type Page } from '@playwright/test';

export class TicketQueuePage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/ui/tickets');

    await expect(
      this.page.getByRole('heading', {
        name: 'Ticket Queue',
      }),
    ).toBeVisible();
  }

  async openTicket(ticketId: string): Promise<void> {
    await this.page
      .getByRole('link', {
        name: ticketId,
      })
      .click();
  }
}
