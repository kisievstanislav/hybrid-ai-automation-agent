import { describe, expect, it, vi } from "vitest";

import type {
  HttpClient,
  HttpResponse,
} from "../../../../../src/application/ports/api/HttpClient.js";
import { ApiError } from "../../../../../src/core/errors/ApiError.js";
import { CustomerType } from "../../../../../src/domain/ticket/CustomerType.js";
import { SupportTeam } from "../../../../../src/domain/ticket/SupportTeam.js";
import { TicketCategory } from "../../../../../src/domain/ticket/TicketCategory.js";
import { TicketPriority } from "../../../../../src/domain/ticket/TicketPriority.js";
import { TicketStatus } from "../../../../../src/domain/ticket/TicketStatus.js";
import { FastifyTicketApiClient } from "../../../../../src/infrastructure/api/ticket/FastifyTicketApiClient.js";

function createHttpResponse<TData>(
  data: TData,
): HttpResponse<TData> {
  return {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
    data,
  };
}

function createMockHttpClient(): HttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };
}

const validTicketResponse = {
  id: "TKT-1001",
  title: "Unable to access account",
  description: "Customer cannot log in.",
  customerType: CustomerType.PREMIUM,
  status: TicketStatus.NEW,
  priority: TicketPriority.HIGH,
  category: TicketCategory.AUTHENTICATION,
  assignedTeam: SupportTeam.IDENTITY_SUPPORT,
  tags: ["login", "account"],
  previousAttempts: 0,
  createdAt: "2026-07-25T14:30:00.000Z",
  updatedAt: "2026-07-25T14:30:00.000Z",
};

describe("FastifyTicketApiClient", () => {
  it("should retrieve and validate a ticket by ID", async () => {
    const httpClient = createMockHttpClient();

    vi.mocked(httpClient.get).mockResolvedValue(
      createHttpResponse(validTicketResponse),
    );

    const client = new FastifyTicketApiClient(httpClient);

    const ticket = await client.getTicketById("TKT-1001");

    expect(httpClient.get).toHaveBeenCalledWith(
      "/tickets/TKT-1001",
    );

    expect(ticket.id).toBe("TKT-1001");
    expect(ticket.createdAt).toBeInstanceOf(Date);
    expect(ticket.updatedAt).toBeInstanceOf(Date);
  });

  it("should retrieve and validate all tickets", async () => {
    const httpClient = createMockHttpClient();

    vi.mocked(httpClient.get).mockResolvedValue(
      createHttpResponse([validTicketResponse]),
    );

    const client = new FastifyTicketApiClient(httpClient);

    const tickets = await client.getAllTickets();

    expect(httpClient.get).toHaveBeenCalledWith("/tickets");
    expect(tickets).toHaveLength(1);
    expect(tickets[0]?.createdAt).toBeInstanceOf(Date);
  });

  it("should reject an invalid ticket response", async () => {
    const httpClient = createMockHttpClient();

    vi.mocked(httpClient.get).mockResolvedValue(
      createHttpResponse({
        ...validTicketResponse,
        priority: "INVALID_PRIORITY",
      }),
    );

    const client = new FastifyTicketApiClient(httpClient);

   await expect(
  client.getTicketById("TKT-1001"),
).rejects.toBeInstanceOf(ApiError);
  });
});