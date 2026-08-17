CREATE TABLE "WorkspaceInvite" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "WorkspaceRole" NOT NULL DEFAULT 'VIEWER',
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WorkspaceInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WorkspaceInvite_tokenHash_key" ON "WorkspaceInvite"("tokenHash");
CREATE INDEX "WorkspaceInvite_workspaceId_createdAt_idx" ON "WorkspaceInvite"("workspaceId", "createdAt");
CREATE INDEX "WorkspaceInvite_email_expiresAt_idx" ON "WorkspaceInvite"("email", "expiresAt");
