-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "customerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT,
    "category" TEXT,
    "assignedTeam" TEXT,
    "tags" JSONB NOT NULL,
    "previousAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QueueItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "correlationId" TEXT NOT NULL,
    "workerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" DATETIME,
    "completedAt" DATETIME,
    "lastError" TEXT,
    CONSTRAINT "QueueItem_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessingResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "queueItemId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "aiClassification" JSONB,
    "decision" TEXT NOT NULL,
    "successful" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessingResult_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProcessingResult_queueItemId_fkey" FOREIGN KEY ("queueItemId") REFERENCES "QueueItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "queueItemId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditEvent_queueItemId_fkey" FOREIGN KEY ("queueItemId") REFERENCES "QueueItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_customerType_idx" ON "Ticket"("customerType");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QueueItem_ticketId_key" ON "QueueItem"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "QueueItem_correlationId_key" ON "QueueItem"("correlationId");

-- CreateIndex
CREATE INDEX "QueueItem_status_createdAt_idx" ON "QueueItem"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QueueItem_workerId_idx" ON "QueueItem"("workerId");

-- CreateIndex
CREATE INDEX "ProcessingResult_ticketId_processedAt_idx" ON "ProcessingResult"("ticketId", "processedAt");

-- CreateIndex
CREATE INDEX "ProcessingResult_queueItemId_idx" ON "ProcessingResult"("queueItemId");

-- CreateIndex
CREATE INDEX "ProcessingResult_correlationId_idx" ON "ProcessingResult"("correlationId");

-- CreateIndex
CREATE INDEX "ProcessingResult_decision_idx" ON "ProcessingResult"("decision");

-- CreateIndex
CREATE INDEX "AuditEvent_ticketId_createdAt_idx" ON "AuditEvent"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_queueItemId_createdAt_idx" ON "AuditEvent"("queueItemId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_correlationId_idx" ON "AuditEvent"("correlationId");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_idx" ON "AuditEvent"("eventType");
