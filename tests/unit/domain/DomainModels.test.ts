import { describe, expect, it } from "vitest";

import {
  AuditEventType,
  CustomerType,
  ProcessingDecision,
  QueueItemStatus,
  SupportTeam,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../../../src/domain/index.js";

import type {
  AiClassificationResult,
  AuditEvent,
  ProcessingResult,
  QueueItem,
  Ticket,
  TicketProcessingDecision,
} from "../../../src/domain/index.js";

describe("Domain models", () => {
  it("should create a valid ticket processing domain flow", () => {
    const createdAt = new Date("2026-07-25T14:30:00Z");
    const updatedAt = new Date("2026-07-25T14:30:00Z");
    const processedAt = new Date("2026-07-25T14:35:00Z");

    const ticket: Ticket = {
      id: "TKT-1001",
      title: "Unable to access account",
      description:
        "The customer reset the password three times but still cannot log in.",
      customerType: CustomerType.PREMIUM,
      status: TicketStatus.NEW,
      priority: null,
      category: null,
      assignedTeam: null,
      tags: ["LOGIN", "PASSWORD_RESET"],
      previousAttempts: 3,
      createdAt,
      updatedAt,
    };

    const queueItem: QueueItem = {
      id: "QUEUE-1001",
      ticketId: ticket.id,
      status: QueueItemStatus.PROCESSING,
      attemptCount: 1,
      correlationId: "CORRELATION-1001",
      workerId: "WORKER-01",
      createdAt,
      claimedAt: processedAt,
      completedAt: null,
      lastError: null,
    };

    const aiClassification: AiClassificationResult = {
      category: TicketCategory.AUTHENTICATION,
      priority: TicketPriority.HIGH,
      recommendedTeam: SupportTeam.IDENTITY_SUPPORT,
      recommendedAction:
        "Review account lock and identity-provider logs.",
      confidence: 0.94,
      reasoningSummary:
        "Repeated password resets did not restore access.",
      riskIndicators: ["MULTIPLE_FAILED_RECOVERY_ATTEMPTS"],
    };

    const decision: TicketProcessingDecision = {
      ticketId: ticket.id,
      decision: ProcessingDecision.AUTO_PROCESS,
      approvedCategory: aiClassification.category,
      approvedPriority: aiClassification.priority,
      approvedTeam: aiClassification.recommendedTeam,
      confidence: aiClassification.confidence,
      reason:
        "AI confidence is above threshold and business rules approved the recommendation.",
    };

    const processingResult: ProcessingResult = {
      id: "RESULT-1001",
      ticketId: ticket.id,
      queueItemId: queueItem.id,
      correlationId: queueItem.correlationId,
      aiClassification,
      decision,
      successful: true,
      message: "Ticket classification applied successfully.",
      processedAt,
    };

    const auditEvent: AuditEvent = {
      id: "AUDIT-1001",
      ticketId: ticket.id,
      queueItemId: queueItem.id,
      correlationId: queueItem.correlationId,
      eventType: AuditEventType.BUSINESS_RULES_EVALUATED,
      eventData: {
        decision: decision.decision,
        confidence: decision.confidence,
      },
      createdAt: processedAt,
    };

    expect(ticket.id).toBe("TKT-1001");
    expect(queueItem.status).toBe(QueueItemStatus.PROCESSING);
    expect(aiClassification.category).toBe(
      TicketCategory.AUTHENTICATION,
    );
    expect(decision.decision).toBe(
      ProcessingDecision.AUTO_PROCESS,
    );
    expect(processingResult.successful).toBe(true);
    expect(auditEvent.eventType).toBe(
      AuditEventType.BUSINESS_RULES_EVALUATED,
    );
  });

  it("should expose the expected supported domain values", () => {
    expect(Object.values(TicketPriority)).toEqual([
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ]);

    expect(Object.values(ProcessingDecision)).toContain(
      "HUMAN_REVIEW",
    );

    expect(Object.values(QueueItemStatus)).toContain(
      "RETRY_PENDING",
    );
  });
});