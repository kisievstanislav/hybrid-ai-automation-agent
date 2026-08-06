import { request, type APIRequestContext } from "@playwright/test";
import type { FastifyInstance } from "fastify";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { createApp } from "../../../src/infrastructure/api/app.js";
import { PlaywrightHttpClient } from "../../../src/infrastructure/api/client/PlaywrightHttpClient.js";
import { FastifyTicketApiClient } from "../../../src/infrastructure/api/ticket/FastifyTicketApiClient.js";

describe("FastifyTicketApiClient integration", () => {
  let app: FastifyInstance;
  let requestContext: APIRequestContext;
  let ticketApiClient: FastifyTicketApiClient;

  beforeEach(async () => {
    app = await createApp();

    await app.listen({
      host: "127.0.0.1",
      port: 0,
    });

    const address = app.server.address();

    if (!address || typeof address === "string") {
      throw new Error("Could not determine Fastify test server port");
    }

    requestContext = await request.newContext({
      baseURL: `http://127.0.0.1:${address.port}`,
    });

    const httpClient = new PlaywrightHttpClient(requestContext);

    ticketApiClient = new FastifyTicketApiClient(httpClient);
  });

  afterEach(async () => {
    await requestContext.dispose();
    await app.close();
  });

  it("should retrieve and validate all tickets", async () => {
    const tickets = await ticketApiClient.getAllTickets();

    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets[0]?.id).toBeDefined();
    expect(tickets[0]?.createdAt).toBeInstanceOf(Date);
    expect(tickets[0]?.updatedAt).toBeInstanceOf(Date);
  });

  it("should retrieve and validate a ticket by ID", async () => {
    const tickets = await ticketApiClient.getAllTickets();
    const firstTicket = tickets[0];

    expect(firstTicket).toBeDefined();

    if (!firstTicket) {
      throw new Error("Expected at least one seeded ticket");
    }

    const ticket = await ticketApiClient.getTicketById(
      firstTicket.id,
    );

    expect(ticket.id).toBe(firstTicket.id);
    expect(ticket.createdAt).toBeInstanceOf(Date);
    expect(ticket.updatedAt).toBeInstanceOf(Date);
  });
});