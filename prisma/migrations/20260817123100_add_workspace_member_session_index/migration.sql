-- Add an index for selecting the earliest workspace membership during session hydration.
CREATE INDEX "WorkspaceMember_userId_createdAt_idx" ON "WorkspaceMember"("userId", "createdAt");
