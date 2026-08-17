CREATE TABLE "WorkspaceInvite" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'VIEWER',
  "tokenHash" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "acceptedAt" DATETIME,
  "revokedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WorkspaceInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WorkspaceInvite_tokenHash_key" ON "WorkspaceInvite"("tokenHash");
CREATE INDEX "WorkspaceInvite_workspaceId_createdAt_idx" ON "WorkspaceInvite"("workspaceId", "createdAt");
CREATE INDEX "WorkspaceInvite_email_expiresAt_idx" ON "WorkspaceInvite"("email", "expiresAt");
