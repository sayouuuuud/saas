-- Durable privacy workflow record; completion remains an explicit reviewed operation.
CREATE TYPE "DataDeletionStatus" AS ENUM ('REQUESTED', 'IN_REVIEW', 'APPROVED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "DataDeletionRequest" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "DataDeletionStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "DataDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DataDeletionRequest_workspaceId_status_requestedAt_idx" ON "DataDeletionRequest"("workspaceId", "status", "requestedAt");
CREATE INDEX "DataDeletionRequest_requestedById_requestedAt_idx" ON "DataDeletionRequest"("requestedById", "requestedAt");

ALTER TABLE "DataDeletionRequest" ADD CONSTRAINT "DataDeletionRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DataDeletionRequest" ADD CONSTRAINT "DataDeletionRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
