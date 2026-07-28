import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../../../src/infrastructure/api/app.js";

describe("Ticket routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = createApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("should return all tickets", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/tickets",
    });

    expect(response.statusCode).toBe(200);

    const tickets = response.json<unknown[]>();

    expect(tickets).toHaveLength(5);
  });

  it("should return one ticket by id", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/tickets/TKT-1001",
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      id: "TKT-1001",
      title: "Unable to access account",
      customerType: "PREMIUM",
      status: "NEW",
    });
  });

  it("should return 404 when the ticket does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/tickets/TKT-9999",
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toEqual({
      code: "TICKET_NOT_FOUND",
      message: "Ticket TKT-9999 was not found",
    });
  });
});