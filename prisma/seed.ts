import {
  CustomerType,
  QueueItemStatus,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../src/generated/prisma/enums.js";
import { prisma } from "../src/infrastructure/database/prisma-client.js";

const tickets = [
  {
    id: "TKT-1001",
    title: "Unable to access account",
    description:
      "The customer reset the password three times but still cannot log in.",
    customerType: CustomerType.PREMIUM,
    status: TicketStatus.NEW,
    priority: null,
    category: null,
    assignedTeam: null,
    tags: ["login", "password-reset", "account-access"],
    previousAttempts: 3,
    createdAt: new Date("2026-07-25T14:30:00.000Z"),
  },
  {
    id: "TKT-1002",
    title: "Duplicate charge on monthly invoice",
    description:
      "The customer reports two identical charges of $249.99 on the latest invoice.",
    customerType: CustomerType.ENTERPRISE,
    status: TicketStatus.NEW,
    priority: TicketPriority.MEDIUM,
    category: TicketCategory.BILLING,
    assignedTeam: null,
    tags: ["billing", "duplicate-charge", "invoice"],
    previousAttempts: 0,
    createdAt: new Date("2026-07-25T15:15:00.000Z"),
  },
  {
    id: "TKT-1003",
    title: "Application crashes during file upload",
    description:
      "The application closes when the customer uploads a PDF larger than 10 MB.",
    customerType: CustomerType.STANDARD,
    status: TicketStatus.NEW,
    priority: null,
    category: TicketCategory.TECHNICAL,
    assignedTeam: null,
    tags: ["application", "file-upload", "crash"],
    previousAttempts: 1,
    createdAt: new Date("2026-07-25T16:00:00.000Z"),
  },
  {
    id: "TKT-1004",
    title: "Suspicious login activity",
    description:
      "The customer received login notifications from an unfamiliar location and did not recognize the activity.",
    customerType: CustomerType.PREMIUM,
    status: TicketStatus.NEW,
    priority: TicketPriority.HIGH,
    category: TicketCategory.SECURITY,
    assignedTeam: null,
    tags: ["security", "suspicious-login", "account-risk"],
    previousAttempts: 0,
    createdAt: new Date("2026-07-25T16:45:00.000Z"),
  },
  {
    id: "TKT-1005",
    title: "Need help",
    description:
      "The customer requested assistance but did not provide enough information to determine the issue.",
    customerType: CustomerType.STANDARD,
    status: TicketStatus.NEW,
    priority: null,
    category: null,
    assignedTeam: null,
    tags: ["insufficient-information"],
    previousAttempts: 0,
    createdAt: new Date("2026-07-25T17:30:00.000Z"),
  },
] as const;

const queueItems = [
  {
    id: "QUEUE-1001",
    ticketId: "TKT-1001",
    correlationId: "CORR-1001",
  },
  {
    id: "QUEUE-1002",
    ticketId: "TKT-1002",
    correlationId: "CORR-1002",
  },
  {
    id: "QUEUE-1003",
    ticketId: "TKT-1003",
    correlationId: "CORR-1003",
  },
  {
    id: "QUEUE-1004",
    ticketId: "TKT-1004",
    correlationId: "CORR-1004",
  },
  {
    id: "QUEUE-1005",
    ticketId: "TKT-1005",
    correlationId: "CORR-1005",
  },
] as const;

async function seedTickets(): Promise<void> {
  for (const ticket of tickets) {
    await prisma.ticket.upsert({
      where: {
        id: ticket.id,
      },
      create: ticket,
      update: {
        title: ticket.title,
        description: ticket.description,
        customerType: ticket.customerType,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        assignedTeam: ticket.assignedTeam,
        tags: ticket.tags,
        previousAttempts: ticket.previousAttempts,
        createdAt: ticket.createdAt,
      },
    });
  }
}

async function seedQueueItems(): Promise<void> {
  for (const queueItem of queueItems) {
    await prisma.queueItem.upsert({
      where: {
        id: queueItem.id,
      },
      create: {
        ...queueItem,
        status: QueueItemStatus.NEW,
        attemptCount: 0,
        workerId: null,
        claimedAt: null,
        completedAt: null,
        nextAttemptAt: null,
        lastError: null,
      },
      update: {
        ticketId: queueItem.ticketId,
        correlationId: queueItem.correlationId,
        status: QueueItemStatus.NEW,
        attemptCount: 0,
        workerId: null,
        claimedAt: null,
        completedAt: null,
        nextAttemptAt: null,
        lastError: null,
      },
    });
  }
}

async function main(): Promise<void> {
  await prisma.$transaction(async () => {
    await seedTickets();
    await seedQueueItems();
  });

  console.log(
    `Seed completed: ${tickets.length} tickets and ${queueItems.length} queue items.`,
  );
}

try {
  await main();
} catch (error: unknown) {
  console.error("Database seed failed.", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}