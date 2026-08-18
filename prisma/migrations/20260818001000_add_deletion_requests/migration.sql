-- Durable privacy workflow record; completion remains an explicit reviewed operation.
CREATE TABLE "DataDeletionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "DataDeletionRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DataDeletionRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "DataDeletionRequest_workspaceId_status_requestedAt_idx" ON "DataDeletionRequest"("workspaceId", "status", "requestedAt");
CREATE INDEX "DataDeletionRequest_requestedById_requestedAt_idx" ON "DataDeletionRequest"("requestedById", "requestedAt");
