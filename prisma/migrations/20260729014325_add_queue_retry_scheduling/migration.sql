-- AlterTable
ALTER TABLE "QueueItem" ADD COLUMN "nextAttemptAt" DATETIME;

-- CreateIndex
CREATE INDEX "QueueItem_status_nextAttemptAt_idx" ON "QueueItem"("status", "nextAttemptAt");
