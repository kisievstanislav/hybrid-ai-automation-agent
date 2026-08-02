import type { FastifyInstance } from 'fastify';

import type { TicketService } from '../../application/services/index.js';
import { SupportTeam, TicketCategory, TicketPriority } from '../../domain/index.js';
import { ticketUiStyles } from './ticket-ui.styles.js';

interface TicketUiRouteOptions {
  readonly ticketService: TicketService;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function createOptions(values: readonly string[], selectedValue: string | null): string {
  return values
    .map(
      (value) => `
        <option
          value="${escapeHtml(value)}"
          ${value === selectedValue ? 'selected' : ''}
        >
          ${escapeHtml(value)}
        </option>
      `,
    )
    .join('');
}

export async function registerTicketUiRoutes(
  app: FastifyInstance,
  options: TicketUiRouteOptions,
): Promise<void> {
  const { ticketService } = options;

  app.get('/ui/tickets', async (_request, reply) => {
    const tickets = await ticketService.getAllTickets();

    const rows = tickets
      .map(
        (ticket) => `
          <tr>
            <td>
              <a
                class="ticket-link"
                href="/ui/tickets/${encodeURIComponent(ticket.id)}"
              >
                ${escapeHtml(ticket.id)}
              </a>
            </td>

            <td>${escapeHtml(ticket.title)}</td>

            <td>
              <span class="badge">
                ${escapeHtml(ticket.status)}
              </span>
            </td>

            <td>${escapeHtml(ticket.priority ?? 'Not assigned')}</td>
            <td>${escapeHtml(ticket.category ?? 'Not assigned')}</td>
            <td>${escapeHtml(ticket.assignedTeam ?? 'Not assigned')}</td>
          </tr>
        `,
      )
      .join('');

    return reply.type('text/html').send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>Ticket Queue</title>

          <style>
            ${ticketUiStyles}
          </style>
        </head>

        <body>
          <header class="page-header">
            <h1>Hybrid AI Support Center</h1>
          </header>

          <main class="page-container">
            <section class="card">
              <h2 class="page-title">Ticket Queue</h2>

              <p class="page-description">
                Review and manage support tickets waiting for processing.
              </p>

              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Ticket ID</th>
                      <th scope="col">Title</th>
                      <th scope="col">Status</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Category</th>
                      <th scope="col">Assigned Team</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${rows}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </body>
      </html>
    `);
  });

  app.get<{ Params: { id: string } }>('/ui/tickets/:id', async (request, reply) => {
    const ticket = await ticketService.getTicketById(request.params.id);

    if (!ticket) {
      return reply.status(404).type('text/html').send(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />

              <title>Ticket Not Found</title>

              <style>
                ${ticketUiStyles}
              </style>
            </head>

            <body>
              <header class="page-header">
                <h1>Hybrid AI Support Center</h1>
              </header>

              <main class="page-container">
                <section class="card">
                  <h2 class="page-title">Ticket not found</h2>

                  <p class="page-description">
                    The requested ticket does not exist.
                  </p>

                  <a href="/ui/tickets">Back to Ticket Queue</a>
                </section>
              </main>
            </body>
          </html>
        `);
    }

    return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <title>${escapeHtml(ticket.id)}</title>

            <style>
              ${ticketUiStyles}
            </style>
          </head>

          <body>
            <header class="page-header">
              <h1>Hybrid AI Support Center</h1>
            </header>

            <main class="page-container">
              <a class="back-link" href="/ui/tickets">
                ← Back to Ticket Queue
              </a>

              <section class="card">
                <h2 class="page-title">Ticket Details</h2>

                <p class="page-description">
                  Review ticket information and update its classification.
                </p>

                <div class="details-grid">
                  <div class="detail-item">
                    <span class="detail-label">Ticket ID</span>
                    <span class="detail-value">
                      ${escapeHtml(ticket.id)}
                    </span>
                  </div>

                  <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="badge">
                      ${escapeHtml(ticket.status)}
                    </span>
                  </div>

                  <div class="detail-item">
                    <span class="detail-label">Title</span>
                    <span class="detail-value">
                      ${escapeHtml(ticket.title)}
                    </span>
                  </div>

                  <div class="detail-item">
                    <span class="detail-label">Customer Type</span>
                    <span class="detail-value">
                      ${escapeHtml(ticket.customerType)}
                    </span>
                  </div>

                  <div class="detail-item">
                    <span class="detail-label">Description</span>
                    <span class="detail-value">
                      ${escapeHtml(ticket.description)}
                    </span>
                  </div>

                  <div class="detail-item">
                    <span class="detail-label">Created Date</span>
                    <span class="detail-value">
                      ${escapeHtml(ticket.createdAt.toISOString())}
                    </span>
                  </div>
                </div>

                <form id="ticket-form">
                  <div class="form-grid">
                    <div>
                      <label for="category">Category</label>

                      <select id="category" name="category" required>
                        <option value="">Select category</option>

                        ${createOptions(Object.values(TicketCategory), ticket.category)}
                      </select>
                    </div>

                    <div>
                      <label for="priority">Priority</label>

                      <select id="priority" name="priority" required>
                        <option value="">Select priority</option>

                        ${createOptions(Object.values(TicketPriority), ticket.priority)}
                      </select>
                    </div>

                    <div>
                      <label for="assignedTeam">Assigned Team</label>

                      <select
                        id="assignedTeam"
                        name="assignedTeam"
                        required
                      >
                        <option value="">Select team</option>

                        ${createOptions(Object.values(SupportTeam), ticket.assignedTeam)}
                      </select>
                    </div>
                  </div>

                  <div class="button-row">
                    <button type="submit">Save Ticket</button>
                  </div>

                  <p id="save-message" role="alert" hidden></p>
                </form>
              </section>
            </main>

            <script>
              const form = document.getElementById('ticket-form');
              const saveMessage = document.getElementById('save-message');
              const saveButton = form.querySelector(
                'button[type="submit"]',
              );

              form.addEventListener('submit', async (event) => {
                event.preventDefault();

                const category =
                  document.getElementById('category').value;

                const priority =
                  document.getElementById('priority').value;

                const assignedTeam =
                  document.getElementById('assignedTeam').value;

                saveMessage.hidden = false;
                saveMessage.textContent = 'Saving ticket...';
                saveButton.disabled = true;

                try {
                  const response = await fetch(
                    '/tickets/${encodeURIComponent(ticket.id)}/classification',
                    {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        category,
                        priority,
                        assignedTeam,
                      }),
                    },
                  );

                  if (!response.ok) {
                    throw new Error('Ticket could not be saved');
                  }

                  saveMessage.textContent =
                    'Ticket updated successfully';
                } catch {
                  saveMessage.textContent = 'Ticket update failed';
                } finally {
                  saveButton.disabled = false;
                }
              });
            </script>
          </body>
        </html>
      `);
  });
}
