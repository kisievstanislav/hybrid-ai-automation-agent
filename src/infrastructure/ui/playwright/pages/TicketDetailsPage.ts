import { expect, type Page } from '@playwright/test';

import type { SupportTeam, TicketCategory, TicketPriority } from '../../../../domain/index.js';

export interface TicketClassificationValues {
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly assignedTeam: SupportTeam;
}

export class TicketDetailsPage {
  constructor(private readonly page: Page) {}

  async verifyLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Ticket Details' })).toBeVisible();
  }

  async updateClassification(values: TicketClassificationValues): Promise<void> {
    await this.page.getByLabel('Category').selectOption(values.category);
    await this.page.getByLabel('Priority').selectOption(values.priority);
    await this.page.getByLabel('Assigned Team').selectOption(values.assignedTeam);
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save Ticket' }).click();

    await expect(this.page.getByRole('alert')).toHaveText('Ticket updated successfully');
  }

  async verifyClassification(expected: TicketClassificationValues): Promise<void> {
    await expect(this.page.getByLabel('Category')).toHaveValue(expected.category);

    await expect(this.page.getByLabel('Priority')).toHaveValue(expected.priority);

    await expect(this.page.getByLabel('Assigned Team')).toHaveValue(expected.assignedTeam);
  }

  async reloadAndVerifyClassification(expected: TicketClassificationValues): Promise<void> {
    await this.page.reload();
    await this.verifyLoaded();
    await this.verifyClassification(expected);
  }
}
